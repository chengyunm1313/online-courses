interface D1SuccessResponse<T> {
  success: true;
  result: Array<{
    success: boolean;
    results?: T[];
    meta?: Record<string, unknown>;
    error?: string;
  }>;
  errors?: Array<{ message?: string }>;
}

export type D1Param = string | number | null;

export class D1ConfigError extends Error {}

interface D1BindingResult<T> {
  results?: T[];
  meta?: Record<string, unknown>;
}

interface D1PreparedStatementLike {
  bind(...params: D1Param[]): {
    all<T>(): Promise<D1BindingResult<T>>;
    run(): Promise<{ meta?: Record<string, unknown> }>;
  };
}

interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatementLike;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new D1ConfigError(`缺少必要的 D1 環境變數：${name}`);
  }
  return value;
}

export function isD1Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
      process.env.CLOUDFLARE_D1_DATABASE_ID &&
      process.env.CLOUDFLARE_API_TOKEN,
  );
}

async function getCloudflareD1Binding(): Promise<D1DatabaseLike | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const context = await getCloudflareContext({ async: true });
    const maybeDb = (context.env as Record<string, unknown>).DB;
    if (
      maybeDb &&
      typeof maybeDb === "object" &&
      "prepare" in maybeDb &&
      typeof (maybeDb as D1DatabaseLike).prepare === "function"
    ) {
      return maybeDb as D1DatabaseLike;
    }
  } catch {
    // 在本機 Node.js、建置階段或非 Cloudflare runtime 下會走 REST fallback。
  }

  return null;
}

function getD1Endpoint(): string {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const databaseId = getRequiredEnv("CLOUDFLARE_D1_DATABASE_ID");
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
}

async function runD1Query<T>(
  sql: string,
  params: D1Param[] = [],
): Promise<{ rows: T[]; meta?: Record<string, unknown> }> {
  const db = await getCloudflareD1Binding();
  if (db) {
    const result = await db.prepare(sql).bind(...params).all<T>();
    return {
      rows: result.results ?? [],
      meta: result.meta,
    };
  }

  if (!isD1Configured()) {
    throw new D1ConfigError("D1 尚未設定，請提供 Cloudflare D1 binding 或 Cloudflare D1 API 環境變數");
  }

  const apiToken = getRequiredEnv("CLOUDFLARE_API_TOKEN");
  const response = await fetch(getD1Endpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sql,
      params,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`D1 請求失敗：${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as D1SuccessResponse<T>;
  if (!payload.success) {
    const message = payload.errors?.map((error) => error.message).filter(Boolean).join("; ");
    throw new Error(message || "D1 回傳失敗");
  }

  const [result] = payload.result;
  if (!result?.success) {
    throw new Error(result?.error || "D1 SQL 執行失敗");
  }

  return {
    rows: result.results ?? [],
    meta: result.meta,
  };
}

export async function queryD1<T>(
  sql: string,
  params: D1Param[] = [],
): Promise<T[]> {
  const result = await runD1Query<T>(sql, params);
  return result.rows;
}

export async function queryFirstD1<T>(
  sql: string,
  params: D1Param[] = [],
): Promise<T | null> {
  const rows = await queryD1<T>(sql, params);
  return rows[0] ?? null;
}

export async function executeD1(
  sql: string,
  params: D1Param[] = [],
): Promise<Record<string, unknown> | undefined> {
  const db = await getCloudflareD1Binding();
  if (db) {
    const result = await db.prepare(sql).bind(...params).run();
    return result.meta;
  }

  const result = await runD1Query<Record<string, unknown>>(sql, params);
  return result.meta;
}

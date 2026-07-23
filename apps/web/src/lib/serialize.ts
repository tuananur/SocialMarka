type JsonPrimitive = string | number | boolean | null;

/** Prisma Date vb. değerleri client props için JSON-uyumlu tipe çevirir */
export type ClientJson<T> = T extends Date
  ? string
  : T extends JsonPrimitive
    ? T
    : T extends Array<infer U>
      ? ClientJson<U>[]
      : T extends object
        ? { [K in keyof T]: ClientJson<T[K]> }
        : T;

export function toClientJson<T>(value: T): ClientJson<T> {
  return JSON.parse(JSON.stringify(value)) as ClientJson<T>;
}

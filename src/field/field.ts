export type FieldKind = 'string' | 'number' | 'boolean' | 'array';

export interface Field<T> {
  readonly __type: T;
  readonly kind: FieldKind;
  readonly optional?: boolean;
  readonly default?: T;
  readonly values?: readonly string[];
  readonly min?: number;
  readonly max?: number;
  readonly item?: Field<unknown>;
  readonly separator?: string;
}
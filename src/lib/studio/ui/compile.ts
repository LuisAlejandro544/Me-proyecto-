// @ts-nocheck
// Compilador de novelas — barrel (código partido en ui/compile/*.ts).
// Re-exporta el contrato público; el generador único vive en standalone.ts.
export * from './compile/types';
export * from './compile/validate';
export * from './compile/historia';
export * from './compile/standalone';
export * from './compile/files';
export * from './compile/modal';

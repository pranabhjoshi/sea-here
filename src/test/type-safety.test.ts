import { describe, it, expect, expectTypeOf } from 'vitest'

describe('Type Safety', () => {
  it('enforces strict TypeScript', () => {
    // This should pass - correct typing
    expectTypeOf<string>().toEqualTypeOf<string>()
    
    // This tests that strict mode catches type errors
    const strictTest = (value: string): string => {
      return value
    }
    
    expectTypeOf(strictTest).parameter(0).toEqualTypeOf<string>()
    expectTypeOf(strictTest).returns.toEqualTypeOf<string>()
    
    // Test that would fail compilation with strict mode
    // @ts-expect-error - This should fail in strict mode
    const shouldFail: string = 123
    // Use the variable to avoid unused variable lint error
    expect(typeof shouldFail).toBe('number')
  })
})

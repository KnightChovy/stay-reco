import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import {
  RegisterCustomerDto,
  RegisterPartnerDto,
} from '../../modules/auth/dto/auth.dto';
import { ZodValidationPipe, zodDto } from './validation';

const pipe = new ZodValidationPipe();
const body = (metatype: unknown) =>
  ({ type: 'body', metatype }) as Parameters<typeof pipe.transform>[1];

const valid = {
  email: '  A@B.com ',
  password: 'secret123',
  fullName: ' Nguyễn Văn A ',
};

function details(fn: () => unknown) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(BadRequestException);
    const res = (err as BadRequestException).getResponse() as {
      code: string;
      details: { field: string }[];
    };
    expect(res.code).toBe('VALIDATION_ERROR');
    return res.details.map((d) => d.field);
  }
  throw new Error('expected validation to fail');
}

describe('ZodValidationPipe', () => {
  it('normalizes input with the shared schema', () => {
    expect(pipe.transform(valid, body(RegisterCustomerDto))).toEqual({
      email: 'a@b.com',
      password: 'secret123',
      fullName: 'Nguyễn Văn A',
    });
  });

  it('rejects unknown fields, even on extended schemas', () => {
    expect(
      details(() =>
        pipe.transform(
          { ...valid, phone: '0901234567', foo: '1' },
          body(RegisterPartnerDto),
        ),
      ),
    ).toEqual(['foo']);
  });

  it('reports each invalid field', () => {
    expect(
      details(() =>
        pipe.transform(
          { email: 'nope', password: 'lettersonly', fullName: '  ' },
          body(RegisterCustomerDto),
        ),
      ).sort(),
    ).toEqual(['email', 'fullName', 'password']);
  });

  it('passes through params without a zod schema', () => {
    expect(pipe.transform('x', body(String))).toBe('x');
    expect(pipe.transform('x', body(ParseUUIDPipe))).toBe('x');
  });

  it('exposes the body schema to Swagger', () => {
    const Dto = zodDto(
      (RegisterPartnerDto as unknown as { schema: never }).schema,
    ) as unknown as { _OPENAPI_METADATA_FACTORY(): Record<string, object> };
    expect(Dto._OPENAPI_METADATA_FACTORY()).toMatchObject({
      email: { type: 'string', required: true },
      companyName: { type: 'string', required: false },
    });
  });
});

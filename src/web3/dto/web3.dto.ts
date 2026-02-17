import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class SignTransactionDto {
  @IsString()
  @IsNotEmpty()
  privateKey: string;

  @IsNotEmpty()
  transaction: {
    to: string;
    value?: string;
    data?: string;
    gas?: string;
    gasPrice?: string;
  };
}

export class SignMessageDto {
  @IsString()
  @IsNotEmpty()
  privateKey: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class RPCRequestDto {
  @IsString()
  @IsNotEmpty()
  method: string;

  @IsArray()
  @IsOptional()
  params?: any[];
}

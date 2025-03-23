import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class WellPromiseRequest {
    @IsUUID('4')
    @IsNotEmpty()
    promiseId: string;

    @IsString()
    @IsNotEmpty()
    message: string;
}
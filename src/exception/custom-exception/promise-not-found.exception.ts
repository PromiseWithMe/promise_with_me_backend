import { HttpStatus } from "@nestjs/common";
import { HttpException } from "../http.exception";

export class PromiseNotFoundException extends HttpException {
    constructor(){
        super("해당하는 ID의 약속이 아닙니다.", HttpStatus.NOT_FOUND)
    }
}
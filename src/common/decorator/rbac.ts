import { Reflector } from "@nestjs/core";
import { ROLE } from "../enum/role";

export const RBAC = Reflector.createDecorator<ROLE>();
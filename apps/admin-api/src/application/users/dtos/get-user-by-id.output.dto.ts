import { GetProfileOutputDto } from './get-profile.output.dto';

/**
 * 根据ID获取用户输出DTO
 *
 * 返回用户信息（已脱敏）。
 *
 * @class GetUserByIdOutputDto
 * @description 根据ID获取用户用例的输出DTO
 */
export class GetUserByIdOutputDto extends GetProfileOutputDto {}

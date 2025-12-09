import { IncomingMessage } from 'node:http';

import { FastifyRequest } from 'fastify';

/**
 * 获取客户端 IP 和端口
 *
 * @description 从请求中提取客户端的真实 IP 地址和端口号，支持代理环境
 *
 * @param request - Fastify 请求对象或 Node.js HTTP 请求对象
 * @returns 返回包含 IP 和端口的对象
 *
 * @example
 * ```typescript
 * const { ip, port } = getClientIpAndPort(request);
 * console.log(`Client IP: ${ip}, Port: ${port}`);
 * ```
 *
 * @note 会按顺序检查以下请求头以获取真实 IP：
 * - x-forwarded-for
 * - x-real-ip
 * - proxy-client-ip
 * - wl-proxy-client-ip
 * - http_client_ip
 * - http_x_forwarded_for
 * 如果都不存在，则使用 socket.remoteAddress
 */
export function getClientIpAndPort(request: FastifyRequest | IncomingMessage): {
  ip: string;
  port: number | null;
} {
  const headersToCheck = [
    'x-forwarded-for',
    'x-real-ip',
    'proxy-client-ip',
    'wl-proxy-client-ip',
    'http_client_ip',
    'http_x_forwarded_for',
  ];

  let ip: string | undefined;
  for (const header of headersToCheck) {
    const headerValue = request.headers[header] as string | undefined;
    if (headerValue) {
      ip = headerValue.split(',')[0].trim();
      if (ip) break;
    }
  }

  if (!ip && 'remoteAddress' in request.socket) {
    ip = request.socket.remoteAddress ?? undefined;
  }

  const port =
    'remotePort' in request.socket ? request.socket.remotePort : null;

  return { ip: ip ?? '', port: port ?? null };
}

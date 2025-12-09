import { describe, expect, it } from '@jest/globals';
import { FastifyRequest } from 'fastify';
import { IncomingMessage } from 'node:http';

import { getClientIpAndPort } from './ip.util.js';

describe('getClientIpAndPort', () => {
  describe('从 FastifyRequest 获取 IP 和端口', () => {
    it('应该从 x-forwarded-for 头获取 IP', () => {
      const request = {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('192.168.1.1');
      expect(result.port).toBe(12345);
    });

    it('当 x-forwarded-for 包含多个 IP 时应取第一个', () => {
      const request = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('192.168.1.1');
    });

    it('应该从 x-real-ip 头获取 IP（当 x-forwarded-for 不存在时）', () => {
      const request = {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('192.168.1.2');
    });

    it('应该从 proxy-client-ip 头获取 IP', () => {
      const request = {
        headers: {
          'proxy-client-ip': '192.168.1.3',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('192.168.1.3');
    });

    it('应该从 wl-proxy-client-ip 头获取 IP', () => {
      const request = {
        headers: {
          'wl-proxy-client-ip': '192.168.1.4',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('192.168.1.4');
    });

    it('应该从 http_client_ip 头获取 IP', () => {
      const request = {
        headers: {
          http_client_ip: '192.168.1.5',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('192.168.1.5');
    });

    it('应该从 http_x_forwarded_for 头获取 IP', () => {
      const request = {
        headers: {
          http_x_forwarded_for: '192.168.1.6',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('192.168.1.6');
    });

    it('当所有请求头都不存在时应使用 socket.remoteAddress', () => {
      const request = {
        headers: {},
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('10.0.0.1');
      expect(result.port).toBe(12345);
    });

    it('当 remoteAddress 为 undefined 时应返回空字符串', () => {
      const request = {
        headers: {},
        socket: {
          remoteAddress: undefined,
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('');
      expect(result.port).toBe(12345);
    });

    it('当 remotePort 为 undefined 时应返回 null', () => {
      const request = {
        headers: {},
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: undefined,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('10.0.0.1');
      expect(result.port).toBe(null);
    });

    it('应该按优先级顺序检查请求头', () => {
      const request = {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
          'proxy-client-ip': '192.168.1.3',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      // 应该优先使用 x-forwarded-for
      expect(result.ip).toBe('192.168.1.1');
    });
  });

  describe('从 IncomingMessage 获取 IP 和端口', () => {
    it('应该从 IncomingMessage 获取 IP 和端口', () => {
      const request = {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as IncomingMessage;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('192.168.1.1');
      expect(result.port).toBe(12345);
    });

    it('应该处理 IPv6 地址', () => {
      const request = {
        headers: {
          'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        },
        socket: {
          remoteAddress: '::1',
          remotePort: 12345,
        },
      } as unknown as IncomingMessage;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });

    it('应该处理 x-forwarded-for 中的 IPv6 地址', () => {
      const request = {
        headers: {
          'x-forwarded-for':
            '2001:0db8:85a3:0000:0000:8a2e:0370:7334, 192.168.1.1',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as IncomingMessage;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串的请求头值', () => {
      const request = {
        headers: {
          'x-forwarded-for': '',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      expect(result.ip).toBe('10.0.0.1');
    });

    it('应该处理只有空格的请求头值', () => {
      const request = {
        headers: {
          'x-forwarded-for': '   ',
        },
        socket: {
          remoteAddress: '10.0.0.1',
          remotePort: 12345,
        },
      } as unknown as FastifyRequest;

      const result = getClientIpAndPort(request);
      // trim 后为空，应该使用 remoteAddress
      expect(result.ip).toBe('10.0.0.1');
    });
  });
});

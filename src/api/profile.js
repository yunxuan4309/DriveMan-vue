import request from './request'

/** 获取当前登录用户的个人信息 */
export function getProfile() {
  return request.get('/profile')
}

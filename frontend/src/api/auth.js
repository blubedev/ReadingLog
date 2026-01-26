import client from './client';

export const authApi = {
  // ユーザー登録
  register: async (username, email, password) => {
    const response = await client.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  // ログイン
  login: async (email, password) => {
    const response = await client.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // ログアウト
  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },

  // 現在のユーザー情報取得
  getMe: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },

  // トークンリフレッシュ
  refreshToken: async () => {
    const response = await client.post('/auth/refresh');
    return response.data;
  },
};

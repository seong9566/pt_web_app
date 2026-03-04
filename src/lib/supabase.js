/**
 * Supabase 클라이언트 설정
 *
 * 앱 전체에서 사용하는 Supabase 클라이언트 싱글톤 인스턴스.
 * PKCE 인증 플로우를 사용하며, 세션 자동 갱신과 URL 기반 세션 감지를 지원.
 * 환경변수(.env.local)에서 Supabase URL과 Anon Key를 읽어옴.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL       // Supabase 프로젝트 URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY // Supabase 퍼블릭 anon 키

/** Supabase 클라이언트 — PKCE 플로우, 세션 영속, URL 세션 감지, 토큰 자동 갱신 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  }
})

/**
 * 운동 매뉴얼 관리 컴포저블
 *
 * 매뉴얼 CRUD, 미디어 파일(사진/영상) 업로드,
 * YouTube URL 연동 기능 제공.
 * 카테고리: '재활' | '근력' | '다이어트' | '스포츠' | '코어' | '유연성'
 */

import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { generateVideoThumbnail } from '@/utils/video'

/** YouTube URL 유효성 검사 정규식 */
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/

/** 운동 매뉴얼 및 미디어 관리 */
export function useManuals() {
  const auth = useAuthStore()
  const manuals = ref([])
  const currentManual = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Storage 공개 URL에서 버킷 내 경로 추출
   * 예: 'https://xxx.supabase.co/storage/v1/object/public/manual-media/uid/file.jpg'
   *  → 'uid/file.jpg'
   */
  function extractStoragePath(publicUrl) {
    if (!publicUrl) return null
    const marker = '/manual-media/'
    const idx = publicUrl.indexOf(marker)
    if (idx === -1) return null
    return publicUrl.slice(idx + marker.length)
  }

  /** 매뉴얼 목록 조회 (카테고리 필터 선택) */
  async function fetchManuals(category = null) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('manuals')
        .select('*, trainer:profiles!trainer_id(name, photo_url), media:manual_media(file_url, file_type, sort_order)')
        .order('created_at', { ascending: false })
      if (category) query = query.eq('category', category)
      const { data, error: err } = await query
      if (err) throw err
      manuals.value = data || []
    } catch (e) {
      error.value = e?.message ?? '매뉴얼 목록을 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 매뉴얼 상세 조회 (미디어 JOIN 포함) */
  async function fetchManual(manualId) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('manuals')
        .select('*, media:manual_media(*), trainer:profiles!trainer_id(name, photo_url)')
        .eq('id', manualId)
        .single()
      if (err) throw err
      currentManual.value = data
    } catch (e) {
      error.value = e?.message ?? '매뉴얼 정보를 불러오지 못했습니다'
    } finally {
      loading.value = false
    }
  }

  /** 매뉴얼 이름 검색 (ilike) */
  async function searchManuals(query) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('manuals')
        .select('*, trainer:profiles!trainer_id(name, photo_url), media:manual_media(file_url, file_type, sort_order)')
        .ilike('title', `%${query}%`)
        .order('created_at', { ascending: false })
      if (err) throw err
      manuals.value = data || []
    } catch (e) {
      error.value = e?.message ?? '매뉴얼 검색에 실패했습니다'
    } finally {
      loading.value = false
    }
  }

  /**
   * 매뉴얼 생성
   * 1. YouTube URL 유효성 검사 (제공된 경우)
   * 2. manuals 테이블에 INSERT
   * 3. mediaFiles를 manual-media 버킷에 업로드
   * 4. manual_media 테이블에 INSERT
   */
  async function createManual(title, category, description, youtubeUrl = null, mediaFiles = []) {
    // 사진 최대 10장 검사
    if (mediaFiles.length > 10) {
      error.value = '사진은 최대 10장까지 업로드할 수 있습니다'
      return false
    }
    // YouTube URL 형식 검사
    if (youtubeUrl && !YOUTUBE_REGEX.test(youtubeUrl)) {
      error.value = '올바른 YouTube URL을 입력해주세요'
      return false
    }
    loading.value = true
    error.value = null
    try {
      // 매뉴얼 기본 정보 저장
      const { data: manual, error: err } = await supabase
        .from('manuals')
        .insert({
          trainer_id: auth.user.id,
          title,
          category,
          description,
          youtube_url: youtubeUrl,
        })
        .select()
        .single()
      if (err) throw err

      // 미디어 파일 업로드 및 manual_media 레코드 생성
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i]
        const fileUrl = await uploadManualMedia(file)
        if (fileUrl) {
          await supabase.from('manual_media').insert({
            manual_id: manual.id,
            file_url: fileUrl,
            file_type: file.type,
            file_size: file.size,
            sort_order: i,
          })
          if (file.type.startsWith('video/')) {
            await uploadVideoThumbnail(manual.id, file)
          }
        }
      }
      return manual.id
    } catch (e) {
      error.value = e?.message ?? '매뉴얼 생성에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 매뉴얼 수정 */
  async function updateManual(manualId, updates) {
    // YouTube URL 형식 검사
    if (updates.youtube_url && !YOUTUBE_REGEX.test(updates.youtube_url)) {
      error.value = '올바른 YouTube URL을 입력해주세요'
      return false
    }
    loading.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('manuals')
        .update(updates)
        .eq('id', manualId)
        .eq('trainer_id', auth.user.id)
      if (err) throw err
      return true
    } catch (e) {
      error.value = e?.message ?? '매뉴얼 수정에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /** 매뉴얼 삭제 (Storage 파일 정리 후 DB 삭제, manual_media는 CASCADE) */
  async function deleteManual(manualId) {
    loading.value = true
    error.value = null
    try {
      // 1. 해당 매뉴얼의 미디어 파일 목록 조회
      const { data: mediaList } = await supabase
        .from('manual_media')
        .select('file_url')
        .eq('manual_id', manualId)

      // 2. Storage 파일 삭제 (실패해도 DB 삭제 계속 진행)
      if (mediaList && mediaList.length > 0) {
        try {
          const paths = mediaList
            .map((m) => extractStoragePath(m.file_url))
            .filter(Boolean)
          if (paths.length > 0) {
            await supabase.storage.from('manual-media').remove(paths)
          }
        } catch (storageErr) {
          // Storage 삭제 실패는 무시 — DB 삭제 계속 진행
          console.warn('Storage 파일 삭제 실패 (무시):', storageErr)
        }
      }

      // 3. DB 삭제 (manual_media는 CASCADE로 자동 삭제)
      const { error: err } = await supabase
        .from('manuals')
        .delete()
        .eq('id', manualId)
        .eq('trainer_id', auth.user.id)
      if (err) throw err
      manuals.value = manuals.value.filter((m) => m.id !== manualId)
      return true
    } catch (e) {
      error.value = e?.message ?? '매뉴얼 삭제에 실패했습니다'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * manual-media 버킷에 파일 업로드
   * - 영상: 500MB 제한
   * - 사진: 10MB 제한
   */
  async function uploadManualMedia(file) {
    const isVideo = file.type.startsWith('video/')
    const maxSize = isVideo ? 500 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error(
        isVideo ? '영상은 500MB 이하만 업로드 가능합니다' : '사진은 10MB 이하만 업로드 가능합니다'
      )
    }
    const ext = file.name.split('.').pop()
    const path = `${auth.user.id}/${Date.now()}.${ext}`
    const { error: err } = await supabase.storage.from('manual-media').upload(path, file)
    if (err) throw err
    const { data } = supabase.storage.from('manual-media').getPublicUrl(path)
    return data.publicUrl
  }

  async function uploadVideoThumbnail(manualId, videoFile) {
    try {
      const blob = await generateVideoThumbnail(videoFile)
      if (!blob) return
      const thumbFile = new File([blob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' })
      const thumbUrl = await uploadManualMedia(thumbFile)
      if (thumbUrl) {
        await supabase.from('manual_media').insert({
          manual_id: manualId,
          file_url: thumbUrl,
          file_type: 'image/jpeg',
          file_size: blob.size,
          sort_order: -1,
        })
      }
    } catch {
    }
  }

  /** 개별 미디어 파일 삭제 (DB + Storage) — edit 모드에서 사용 */
  async function deleteManualMedia(mediaId, fileUrl) {
    try {
      // Storage 파일 삭제 (실패해도 DB 삭제 계속 진행)
      try {
        const path = extractStoragePath(fileUrl)
        if (path) {
          await supabase.storage.from('manual-media').remove([path])
        }
      } catch (storageErr) {
        console.warn('Storage 파일 삭제 실패 (무시):', storageErr)
      }
      // DB 레코드 삭제
      const { error: err } = await supabase
        .from('manual_media')
        .delete()
        .eq('id', mediaId)
      if (err) throw err
      return true
    } catch (e) {
      error.value = e?.message ?? '미디어 삭제에 실패했습니다'
      return false
    }
  }

  /** 기존 매뉴얼에 미디어 추가 (edit 모드용) */
  async function addManualMedia(manualId, files) {
    try {
      // 현재 최대 sort_order 조회
      const { data: existing } = await supabase
        .from('manual_media')
        .select('sort_order')
        .eq('manual_id', manualId)
        .order('sort_order', { ascending: false })
        .limit(1)
      const startOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileUrl = await uploadManualMedia(file)
        if (fileUrl) {
          await supabase.from('manual_media').insert({
            manual_id: manualId,
            file_url: fileUrl,
            file_type: file.type,
            file_size: file.size,
            sort_order: startOrder + i,
          })
          if (file.type.startsWith('video/')) {
            await uploadVideoThumbnail(manualId, file)
          }
        }
      }
      return true
    } catch (e) {
      error.value = e?.message ?? '미디어 추가에 실패했습니다'
      return false
    }
  }

  return {
    manuals,
    currentManual,
    loading,
    error,
    fetchManuals,
    fetchManual,
    searchManuals,
    createManual,
    updateManual,
    deleteManual,
    uploadManualMedia,
    deleteManualMedia,
    addManualMedia,
    extractStoragePath,
  }
}

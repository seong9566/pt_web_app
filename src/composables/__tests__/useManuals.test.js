import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useManuals } from '@/composables/useManuals'

const mockEnv = vi.hoisted(() => {
  const authStore = { user: { id: 'trainer-1' } }
  const storageBucket = {
    remove: vi.fn().mockResolvedValue({ error: null }),
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/manual-media/trainer-1/file.jpg' } }),
  }
  return {
    authStore,
    supabase: {
      from: vi.fn(),
      storage: { from: vi.fn().mockReturnValue(storageBucket) },
    },
    storageBucket,
  }
})

vi.mock('@/stores/auth', () => ({ useAuthStore: () => mockEnv.authStore }))
vi.mock('@/lib/supabase', () => ({ supabase: mockEnv.supabase }))

function createBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    ilike: vi.fn(() => builder),
    in: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  }
  return builder
}

describe('useManuals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mediaFiles가 11개이면 createManual이 실패하고 에러를 설정한다', async () => {
    const { createManual, error } = useManuals()
    const mediaFiles = Array(11).fill({ name: 'a.jpg', type: 'image/jpeg', size: 1000 })
    const result = await createManual('제목', '근력', '설명', null, mediaFiles)

    expect(result).toBe(false)
    expect(error.value).toBe('사진은 최대 10장까지 업로드할 수 있습니다')
    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('잘못된 YouTube URL이면 createManual이 실패한다', async () => {
    const { createManual, error } = useManuals()
    const result = await createManual('제목', '근력', '설명', 'https://vimeo.com/123456', [])

    expect(result).toBe(false)
    expect(error.value).toBe('올바른 YouTube URL을 입력해주세요')
    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('올바른 youtube.com URL은 검증을 통과한다', async () => {
    const builder = createBuilder()
    builder.single.mockResolvedValue({ data: { id: 'manual-1' }, error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { createManual } = useManuals()
    const result = await createManual('제목', '근력', '설명', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', [])

    expect(result).toBe('manual-1')
  })

  it('올바른 youtu.be URL도 검증을 통과한다', async () => {
    const builder = createBuilder()
    builder.single.mockResolvedValue({ data: { id: 'manual-2' }, error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { createManual } = useManuals()
    const result = await createManual('제목', '근력', '설명', 'https://youtu.be/dQw4w9WgXcQ', [])

    expect(result).toBe('manual-2')
  })

  it('updateManual에 잘못된 youtube_url이 있으면 실패한다', async () => {
    const { updateManual, error } = useManuals()
    const result = await updateManual('manual-1', { youtube_url: 'not-a-url' })

    expect(result).toBe(false)
    expect(error.value).toBe('올바른 YouTube URL을 입력해주세요')
    expect(mockEnv.supabase.from).not.toHaveBeenCalled()
  })

  it('deleteManual 성공 시 로컬 manuals 배열에서 해당 id를 제거한다', async () => {
    const mediaBuilder = createBuilder()
    mediaBuilder.eq.mockResolvedValue({ data: [], error: null })

    const deleteBuilder = createBuilder()
    deleteBuilder.eq
      .mockReturnValueOnce(deleteBuilder)
      .mockResolvedValueOnce({ error: null })

    mockEnv.supabase.from
      .mockReturnValueOnce(mediaBuilder)
      .mockReturnValueOnce(deleteBuilder)

    const { manuals, deleteManual } = useManuals()
    manuals.value = [{ id: 'm1' }, { id: 'm2' }]
    await deleteManual('m1')

    expect(manuals.value).toHaveLength(1)
    expect(manuals.value[0].id).toBe('m2')
  })

  it('uploadManualMedia는 영상 500MB 초과 시 에러를 throw한다', async () => {
    const { uploadManualMedia } = useManuals()
    const file = { name: 'video.mp4', type: 'video/mp4', size: 501 * 1024 * 1024 }

    await expect(uploadManualMedia(file)).rejects.toThrow('영상은 500MB 이하만 업로드 가능합니다')
  })

  it('uploadManualMedia는 사진 10MB 초과 시 에러를 throw한다', async () => {
    const { uploadManualMedia } = useManuals()
    const file = { name: 'photo.jpg', type: 'image/jpeg', size: 11 * 1024 * 1024 }

    await expect(uploadManualMedia(file)).rejects.toThrow('사진은 10MB 이하만 업로드 가능합니다')
  })

  it('fetchManuals select 쿼리에 media:manual_media JOIN이 포함된다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({ data: [], error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { fetchManuals } = useManuals()
    await fetchManuals()

    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining('media:manual_media')
    )
  })

  it('searchManuals select 쿼리에 media:manual_media JOIN이 포함된다', async () => {
    const builder = createBuilder()
    builder.order.mockResolvedValue({ data: [], error: null })
    mockEnv.supabase.from.mockReturnValue(builder)

    const { searchManuals } = useManuals()
    await searchManuals('스쿼트')

    expect(builder.select).toHaveBeenCalledWith(
      expect.stringContaining('media:manual_media')
    )
  })

  it('deleteManual은 Storage remove()를 호출한다', async () => {
    const mediaBuilder = createBuilder()
    mediaBuilder.eq.mockResolvedValue({
      data: [{ file_url: 'https://example.supabase.co/storage/v1/object/public/manual-media/trainer-1/file.jpg' }],
      error: null,
    })

    const deleteBuilder = createBuilder()
    deleteBuilder.eq
      .mockReturnValueOnce(deleteBuilder)
      .mockResolvedValueOnce({ error: null })

    mockEnv.supabase.from
      .mockReturnValueOnce(mediaBuilder)
      .mockReturnValueOnce(deleteBuilder)

    const { deleteManual } = useManuals()
    await deleteManual('m1')

    expect(mockEnv.storageBucket.remove).toHaveBeenCalledWith(['trainer-1/file.jpg'])
  })

  it('deleteManual은 Storage 삭제 실패 시에도 DB 삭제를 진행한다', async () => {
    const mediaBuilder = createBuilder()
    mediaBuilder.eq.mockResolvedValue({
      data: [{ file_url: 'https://example.supabase.co/storage/v1/object/public/manual-media/trainer-1/file.jpg' }],
      error: null,
    })

    mockEnv.storageBucket.remove.mockRejectedValueOnce(new Error('Storage error'))

    const deleteBuilder = createBuilder()
    deleteBuilder.eq
      .mockReturnValueOnce(deleteBuilder)
      .mockResolvedValueOnce({ error: null })

    mockEnv.supabase.from
      .mockReturnValueOnce(mediaBuilder)
      .mockReturnValueOnce(deleteBuilder)

    const { manuals, deleteManual } = useManuals()
    manuals.value = [{ id: 'm1' }]
    const result = await deleteManual('m1')

    expect(result).toBe(true)
    expect(manuals.value).toHaveLength(0)
  })

  it('deleteManualMedia는 DB와 Storage 모두 삭제한다', async () => {
    const dbBuilder = createBuilder()
    dbBuilder.eq.mockResolvedValue({ error: null })
    mockEnv.supabase.from.mockReturnValue(dbBuilder)

    const { deleteManualMedia } = useManuals()
    const result = await deleteManualMedia('media-1', 'https://example.supabase.co/storage/v1/object/public/manual-media/trainer-1/file.jpg')

    expect(result).toBe(true)
    expect(mockEnv.storageBucket.remove).toHaveBeenCalledWith(['trainer-1/file.jpg'])
    expect(dbBuilder.delete).toHaveBeenCalled()
  })

  it('addManualMedia는 파일 업로드 후 DB INSERT한다', async () => {
    const sortBuilder = createBuilder()
    sortBuilder.limit.mockResolvedValue({ data: [], error: null })
    const insertBuilder = createBuilder()
    insertBuilder.insert.mockResolvedValue({ error: null })

    mockEnv.supabase.from
      .mockReturnValueOnce(sortBuilder)
      .mockReturnValueOnce(insertBuilder)

    const { addManualMedia } = useManuals()
    const file = { name: 'photo.jpg', type: 'image/jpeg', size: 1000 }
    const result = await addManualMedia('manual-1', [file])

    expect(result).toBe(true)
    expect(mockEnv.storageBucket.upload).toHaveBeenCalled()
  })

  it('extractStoragePath는 공개 URL에서 버킷 이후 경로를 추출한다', () => {
    const { extractStoragePath } = useManuals()

    const url = 'https://xxx.supabase.co/storage/v1/object/public/manual-media/uid/1234567890.jpg'
    expect(extractStoragePath(url)).toBe('uid/1234567890.jpg')
  })
})

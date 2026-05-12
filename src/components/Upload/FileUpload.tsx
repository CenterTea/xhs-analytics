import { useState, useCallback, useRef } from 'react'
import { parseFile } from '../../utils/parse'

interface FileUploadProps {
  onDataLoaded: (data: { posts: import('../../types').Post[] }) => void
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      setError('')
      setLoading(true)

      try {
        const ext = file.name.split('.').pop()?.toLowerCase()
        if (!['csv', 'xlsx', 'xls', 'json'].includes(ext ?? '')) {
          setError('不支持的文件格式，请上传 CSV、Excel 或 JSON 文件')
          setLoading(false)
          return
        }

        let posts: import('../../types').Post[]

        if (ext === 'json') {
          const text = await file.text()
          const data = JSON.parse(text)
          posts = Array.isArray(data) ? data : data.posts ?? data.data ?? []
        } else {
          posts = await parseFile(file)
        }

        if (posts.length === 0) {
          setError('文件中没有找到帖子数据，请检查文件格式')
          setLoading(false)
          return
        }

        onDataLoaded({ posts })
      } catch (e) {
        setError(`文件解析失败：${e instanceof Error ? e.message : '未知错误'}`)
      } finally {
        setLoading(false)
      }
    },
    [onDataLoaded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 hover:border-red-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleChange}
          className="hidden"
        />
        {loading ? (
          <div className="text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p>正在解析文件...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-600 font-medium mb-1">
              拖拽文件到这里，或点击选择文件
            </p>
            <p className="text-sm text-gray-400">
              支持 CSV、Excel（.xlsx/.xls）、JSON 格式
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}

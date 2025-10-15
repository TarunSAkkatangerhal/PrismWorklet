import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Star,
  Trophy,
  ExternalLink,
  Upload,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  Clock,
  Shield,
  Target,
  PlusCircle,
  X,
  Trash2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  BookUser,
  Lightbulb,
  Search,
} from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import LeftSidebar from '../components/Left'
import apiClient from '../services/secureWorkletsAPI' // reuse configured axios instance for auth headers

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:8000'

// --- API HELPERS (live) ---
const authHeader = () => {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const fetchStudentPortfolio = async () => {
  const resp = await apiClient.get('/api/portfolio/student/me')
  return resp.data
}

const fetchCompletedWorkletsForCurrentUser = async () => {
  // Use associations endpoint similar to existing code; attempt both mentor & student roles
  const token = localStorage.getItem('access_token')
  if (!token) return { completed: [] }
  const profileResp = await fetch(`${API_BASE}/auth/profile`, { headers: authHeader() })
  if (!profileResp.ok) throw new Error('Failed to load profile')
  const profile = await profileResp.json()
  const userId = profile.id
  // We need worklets with status Completed regardless of role; try fetching association endpoint (mentor path used previously)
  const assocResp = await fetch(`${API_BASE}/api/associations/mentor/${userId}/all-worklets`, { headers: authHeader() })
  if (!assocResp.ok) return { completed: [] }
  const assocData = await assocResp.json()
  return { completed: assocData.completed_worklets || [] }
}

const submitPortfolioItem = async (type, formData) => {
  const endpoint = `${API_BASE}/api/portfolio/${type}`
  const resp = await fetch(endpoint, { method: 'POST', headers: { ...authHeader() }, body: formData })
  if (!resp.ok) throw new Error(`Failed to create ${type.slice(0, -1)}`)
  return await resp.json()
}

// --- INITIAL EMPTY STATE ---
const emptyPortfolio = {
  mentor: null,
  achievements: [],
  papers: [],
  patents: [],
  commercializations: [],
  stats: null,
  worklets: [],
}

// --- REUSABLE & IMPROVED COMPONENTS ---
const Input = ({ register, name, errors, ...rest }) => (
  <div className="w-full">
    <input
      {...register(name)}
      {...rest}
      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
  </div>
)

const Textarea = ({ register, name, errors, ...rest }) => (
  <div className="w-full">
    <textarea
      {...register(name)}
      {...rest}
      className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
  </div>
)

const FileUpload = ({ onFileChange, file }) => {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = React.useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) onFileChange(e.dataTransfer.files[0])
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) onFileChange(e.target.files[0])
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
        dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
      }`}>
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} accept=".pdf,.doc,.docx" />
      {!file ? (
        <div>
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">PDF, DOC, DOCX (Max 5MB)</p>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 text-left">
            <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onFileChange(null)
            }}
            className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b p-6 pb-3 dark:border-gray-600 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            disabled={children.props.isSubmitting}>
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow p-6 pt-4">{children}</div>
      </div>
    </div>
  )
}

const PreviewModal = ({ url, onClose }) => {
  const [showError, setShowError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = React.useRef(null)

  const handleOpenInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleIframeError = () => {
    setShowError(true)
    setIsLoading(false)
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
    try {
      // Try to access iframe content - if blocked, this will fail
      const iframe = iframeRef.current
      if (iframe && iframe.contentDocument === null) {
        setShowError(true)
      }
    } catch (e) {
      setShowError(true)
    }
  }

  React.useEffect(() => {
    if (!url) return

    const iframe = iframeRef.current
    if (!iframe) return

    // Reset states when url changes
    setShowError(false)
    setIsLoading(true)

    // Set a shorter timeout to check if iframe loaded successfully
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setShowError(true)
        setIsLoading(false)
      }
    }, 800) // Reduced from 2000ms to 800ms

    return () => clearTimeout(timeoutId)
  }, [url, isLoading])

  if (!url) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b p-3 dark:border-gray-600 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
              title="Open in new tab">
              <ExternalLink size={16} />
              <span>Open in New Tab</span>
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-hidden bg-gray-100 dark:bg-gray-900 relative">
          {showError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Preview Not Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  This document cannot be previewed directly in the browser. Please open it in a new tab to view the content.
                </p>
                <button
                  onClick={handleOpenInNewTab}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                  <ExternalLink size={20} />
                  <span>Open in New Tab</span>
                </button>
              </div>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200 dark:border-gray-700">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Loading Preview...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                  Please wait while we load the document preview.
                </p>
                <button
                  onClick={handleOpenInNewTab}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
                  <ExternalLink size={20} />
                  <span>Open in New Tab Instead</span>
                </button>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={url}
              title="Document Preview"
              className="w-full h-full border-none"
              onError={handleIframeError}
              onLoad={handleIframeLoad}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// --- IMPROVED FORMS ---
const AddPaperForm = ({ onAdd, onCancel, completedWorklets }) => {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const loadingWorklets = false
  const [selectedWorkletId, setSelectedWorkletId] = useState('')
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { authors: [{ name: '' }], worklet_id: '' },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'authors' })
  const workletId = watch('worklet_id')

  // Completed worklets now passed in props

  const onSubmit = async (data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      if (key === 'authors') formData.append(key, JSON.stringify(data[key].filter((a) => a.name)))
      else formData.append(key, data[key])
    })
    if (file) formData.append('document', file)

    // Add worklet cert_id if worklet is selected
    if (data.worklet_id) {
      const selectedWorklet = completedWorklets.find((w) => w.id === parseInt(data.worklet_id))
      if (selectedWorklet) {
        formData.append('worklet_cert_id', selectedWorklet.cert_id)
        formData.append('worklet_id', selectedWorklet.id) // Also send the worklet ID
        console.log('Sending worklet data (paper):', { 
          worklet_id: selectedWorklet.id, 
          worklet_cert_id: selectedWorklet.cert_id 
        })
      }
    }
    
    try {
      const newPaper = await submitPortfolioItem('papers', formData)
      console.log('Backend response (paper):', newPaper)
      
      // Add worklet information to the new paper object
      if (data.worklet_id) {
        const selectedWorklet = completedWorklets.find((w) => w.id === parseInt(data.worklet_id))
        if (selectedWorklet) {
          newPaper.worklet_cert_id = selectedWorklet.cert_id
          newPaper.worklet_id = selectedWorklet.id
        }
      }
      
      // adapt field name differences
      if (!newPaper.year && newPaper.publication_year) newPaper.year = newPaper.publication_year
      if (file) {
        // optimistic preview if backend served file accessible
        newPaper.previewUrl = newPaper.document_link || URL.createObjectURL(file)
      }
      
      // Ensure the record has an ID for display
      if (!newPaper.id) {
        newPaper.id = Date.now() // Temporary ID until backend refresh
      }
      
      onAdd('papers', newPaper)
    } catch (error) {
      console.error('Submission failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <BookUser size={20} className="mr-2 text-blue-500" /> Select Worklet
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Associated Worklet <span className="text-red-500">*</span>
            </label>
            <select
              {...register('worklet_id', { required: 'Please select a worklet' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loadingWorklets}>
              <option value="">Select a completed worklet</option>
              {completedWorklets.map((worklet) => {
                const description = worklet.description || worklet.title || 'No description'
                const truncatedDesc = description.length > 50 ? description.substring(0, 50) + '...' : description
                return (
                  <option key={worklet.id} value={worklet.id}>
                    {worklet.cert_id} - {truncatedDesc}
                  </option>
                )
              })}
            </select>
            {loadingWorklets && <p className="text-xs text-gray-500 mt-1">Loading worklets...</p>}
            {errors.worklet_id && <p className="text-xs text-red-500 mt-1">{errors.worklet_id.message}</p>}
            {completedWorklets.length === 0 && !loadingWorklets && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                No completed worklets found. Please complete a worklet first.
              </p>
            )}
          </div>
          {workletId && (
            <>
              <Input
                name="title"
                register={register}
                errors={errors}
                placeholder="Paper Title"
                {...register('title', { required: 'Title is required' })}
              />
              <Input
                name="journal"
                register={register}
                errors={errors}
                placeholder="Journal / Conference"
                {...register('journal', { required: 'Journal is required' })}
              />
              <div className="flex gap-4">
                <Input
                  name="year"
                  type="number"
                  register={register}
                  errors={errors}
                  placeholder="Year"
                  defaultValue={new Date().getFullYear()}
                  {...register('year', { required: 'Year is required' })}
                />
                <Input name="doi" register={register} errors={errors} placeholder="DOI (e.g., 10.xxxx/xxxx)" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                  Next <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <BookUser size={20} className="mr-2 text-blue-500" /> Authors & Abstract
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Authors</label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 mb-2">
                <Input
                  name={`authors.${index}.name`}
                  register={register}
                  errors={errors}
                  placeholder={`Author ${index + 1} Name`}
                  {...register(`authors.${index}.name`, { required: 'Author name is required' })}
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ name: '' })}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              + Add Author
            </button>
          </div>
          <Textarea
            name="abstract"
            register={register}
            errors={errors}
            placeholder="Abstract"
            rows="4"
            {...register('abstract', { required: 'Abstract is required' })}
          />
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 flex items-center">
              <ArrowLeft size={16} className="mr-2" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center">
              Next <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <Upload size={20} className="mr-2 text-blue-500" /> Upload Document
          </h4>
          <FileUpload onFileChange={setFile} file={file} />
          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 flex items-center"
              disabled={isSubmitting}>
              <ArrowLeft size={16} className="mr-2" /> Previous
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {isSubmitting ? 'Submitting...' : 'Add Paper'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}

const AddPatentForm = ({ onAdd, onCancel, completedWorklets }) => {
  const [file, setFile] = useState(null)
  const loadingWorklets = false
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { inventors: [{ name: '' }], worklet_id: '' },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'inventors' })
  const workletId = watch('worklet_id')

  // Completed worklets passed via props

  const onSubmit = async (data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      if (key === 'inventors') formData.append(key, JSON.stringify(data[key].filter((inv) => inv.name)))
      else formData.append(key, data[key])
    })
    if (file) formData.append('document', file)

    // Add worklet cert_id if worklet is selected
    if (data.worklet_id) {
      const selectedWorklet = completedWorklets.find((w) => w.id === parseInt(data.worklet_id))
      if (selectedWorklet) {
        formData.append('worklet_cert_id', selectedWorklet.cert_id)
        formData.append('worklet_id', selectedWorklet.id) // Also send the worklet ID
        console.log('Sending worklet data (patent):', { 
          worklet_id: selectedWorklet.id, 
          worklet_cert_id: selectedWorklet.cert_id 
        })
      }
    }

    try {
      const newPatent = await submitPortfolioItem('patents', formData)
      console.log('Backend response (patent):', newPatent)
      
      // Add worklet information to the new patent object
      if (data.worklet_id) {
        const selectedWorklet = completedWorklets.find((w) => w.id === parseInt(data.worklet_id))
        if (selectedWorklet) {
          newPatent.worklet_cert_id = selectedWorklet.cert_id
          newPatent.worklet_id = selectedWorklet.id
        }
      }
      
      if (file) newPatent.previewUrl = newPatent.document_link || URL.createObjectURL(file)
      
      // Ensure the record has an ID for display
      if (!newPatent.id) {
        newPatent.id = Date.now() // Temporary ID until backend refresh
      }
      
      onAdd('patents', newPatent)
    } catch (error) {
      console.error('Submission failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
        <Lightbulb size={20} className="mr-2 text-yellow-500" /> Select Worklet
      </h4>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Associated Worklet <span className="text-red-500">*</span>
        </label>
        <select
          {...register('worklet_id', { required: 'Please select a worklet' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={loadingWorklets}>
          <option value="">Select a completed worklet</option>
          {completedWorklets.map((worklet) => {
            const description = worklet.description || worklet.title || 'No description'
            const truncatedDesc = description.length > 50 ? description.substring(0, 50) + '...' : description
            return (
              <option key={worklet.id} value={worklet.id}>
                {worklet.cert_id} - {truncatedDesc}
              </option>
            )
          })}
        </select>
        {loadingWorklets && <p className="text-xs text-gray-500 mt-1">Loading worklets...</p>}
        {errors.worklet_id && <p className="text-xs text-red-500 mt-1">{errors.worklet_id.message}</p>}
        {completedWorklets.length === 0 && !loadingWorklets && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            No completed worklets found. Please complete a worklet first.
          </p>
        )}
      </div>
      {workletId && (
        <>
          <Input
            name="title"
            register={register}
            errors={errors}
            placeholder="Patent Title"
            {...register('title', { required: 'Title is required' })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventors</label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 mb-2">
                <Input
                  name={`inventors.${index}.name`}
                  register={register}
                  errors={errors}
                  placeholder={`Inventor ${index + 1} Name`}
                  {...register(`inventors.${index}.name`, { required: 'Inventor name is required' })}
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ name: '' })}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              + Add Inventor
            </button>
          </div>
          <div className="flex gap-4">
            <Input
              name="application_number"
              register={register}
              errors={errors}
              placeholder="Application Number"
              {...register('application_number', { required: 'Application number is required' })}
            />
            <Input
              name="filing_year"
              type="number"
              register={register}
              errors={errors}
              placeholder="Filing Year"
              defaultValue={new Date().getFullYear()}
            />
          </div>
          <Textarea
            name="description"
            register={register}
            errors={errors}
            placeholder="Brief Description"
            rows="3"
            {...register('description', { required: 'Description is required' })}
          />
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center pt-2">
            <Upload size={20} className="mr-2 text-yellow-500" /> Supporting Document
          </h4>
          <FileUpload onFileChange={setFile} file={file} />
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {isSubmitting ? 'Submitting...' : 'Add Patent'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}

const AddCommercializationForm = ({ onAdd, onCancel, completedWorklets }) => {
  const loadingWorklets = false
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { worklet_id: '' },
  })

  const workletId = watch('worklet_id')

  // Completed worklets passed via props

  const onSubmit = async (data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => formData.append(key, data[key]))

    if (data.worklet_id) {
      const selectedWorklet = completedWorklets.find((w) => w.id === parseInt(data.worklet_id))
      if (selectedWorklet) {
        formData.append('worklet_cert_id', selectedWorklet.cert_id)
        formData.append('worklet_id', selectedWorklet.id) // Also send the worklet ID
        console.log('Sending worklet data:', { 
          worklet_id: selectedWorklet.id, 
          worklet_cert_id: selectedWorklet.cert_id 
        })
      }
    }
    try {
      const newRecord = await submitPortfolioItem('commercializations', formData)
      console.log('Backend response:', newRecord)
      
      // Add worklet information to the new commercialization object
      if (data.worklet_id) {
        const selectedWorklet = completedWorklets.find((w) => w.id === parseInt(data.worklet_id))
        if (selectedWorklet) {
          newRecord.worklet_cert_id = selectedWorklet.cert_id
          newRecord.worklet_id = selectedWorklet.id
        }
      }
      
      // Ensure the record has an ID for display
      if (!newRecord.id) {
        newRecord.id = Date.now() // Temporary ID until backend refresh
      }
      
      onAdd('commercializations', newRecord)
    } catch (error) {
      console.error('Submission failed', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
        <Target size={20} className="mr-2 text-green-500" /> Commercialization Record
      </h4>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Associated Worklet <span className="text-red-500">*</span>
        </label>
        <select
          {...register('worklet_id', { required: 'Please select a worklet' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={loadingWorklets}>
          <option value="">Select a completed worklet</option>
          {completedWorklets.map((worklet) => {
            const description = worklet.description || worklet.title || 'No description'
            const truncatedDesc = description.length > 50 ? description.substring(0, 50) + '...' : description
            return (
              <option key={worklet.id} value={worklet.id}>
                {worklet.cert_id} - {truncatedDesc}
              </option>
            )
          })}
        </select>
        {loadingWorklets && <p className="text-xs text-gray-500 mt-1">Loading worklets...</p>}
        {errors.worklet_id && <p className="text-xs text-red-500 mt-1">{errors.worklet_id.message}</p>}
        {completedWorklets.length === 0 && !loadingWorklets && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            No completed worklets found. Please complete a worklet first.
          </p>
        )}
      </div>

      {workletId && (
        <>
          <Input
            name="title"
            register={register}
            errors={errors}
            placeholder="Product/Service Title"
            {...register('title', { required: 'Title is required' })}
          />
          <Input name="year" type="number" register={register} errors={errors} placeholder="Year" defaultValue={new Date().getFullYear()} />
          <Input name="link" register={register} errors={errors} placeholder="Product Link (e.g., https://...)" />
          <Textarea
            name="description"
            register={register}
            errors={errors}
            placeholder="Description"
            rows="3"
            {...register('description', { required: 'Description is required' })}
          />
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
              disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center"
              disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {isSubmitting ? 'Submitting...' : 'Add Record'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}

// --- MAIN PORTFOLIO COMPONENT ---
const Portfolio = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('achievements')
  const [expandedRows, setExpandedRows] = useState({})
  const [portfolioData, setPortfolioData] = useState(emptyPortfolio)
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)
  const [portfolioError, setPortfolioError] = useState(null)
  const [completedWorklets, setCompletedWorklets] = useState([])
  const [loadingCompleted, setLoadingCompleted] = useState(true)
  const [modalType, setModalType] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoadingPortfolio(true)
      const data = await fetchStudentPortfolio()
      
      // Map publication_year to year for uniform display and add previewUrl
      data.papers = data.papers.map(p => ({ 
        ...p, 
        year: p.publication_year || p.year,
        previewUrl: p.document_link || p.previewUrl
      }))
      // Add previewUrl to patents
      data.patents = data.patents.map(pt => ({ 
        ...pt, 
        previewUrl: pt.document_link || pt.previewUrl
      }))
      // Add previewUrl to commercializations
      data.commercializations = data.commercializations.map(c => ({ 
        ...c, 
        previewUrl: c.document_link || c.previewUrl
      }))
      
      setPortfolioData(data)
    } catch (e) {
      setPortfolioError(e.message || 'Failed to load portfolio')
    } finally {
      setLoadingPortfolio(false)
    }
  }, [])

  const loadCompletedWorklets = useCallback(async () => {
    try {
      setLoadingCompleted(true)
      const { completed } = await fetchCompletedWorkletsForCurrentUser()
      setCompletedWorklets(completed)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingCompleted(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    loadCompletedWorklets()
  }, [loadData, loadCompletedWorklets])

  // Reload data when returning to this page (in case we navigated away and back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loadData])

  const achievementIcon = (type) => {
    switch (type) {
      case 'Award':
        return Trophy
      case 'Recognition':
        return Star
      default:
        return Award
    }
  }

  const toggleRowExpansion = (section, id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [`${section}-${id}`]: !prev[`${section}-${id}`],
    }))
  }

  const handleAddItem = (section, newItem) => {
    setPortfolioData((prevData) => ({
      ...prevData,
      [section]: [...prevData[section], newItem],
    }))
    setModalType(null)
  }

  const tabs = [
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'papers', label: 'Papers', icon: FileText },
    { id: 'patents', label: 'Patents', icon: Shield },
    { id: 'commercializations', label: 'Commercializations', icon: Target },
  ]

  const renderModalContent = () => {
    switch (modalType) {
      case 'paper':
        return <AddPaperForm completedWorklets={completedWorklets} onAdd={handleAddItem} onCancel={() => setModalType(null)} />
      case 'patent':
        return <AddPatentForm completedWorklets={completedWorklets} onAdd={handleAddItem} onCancel={() => setModalType(null)} />
      case 'commercialization':
        return <AddCommercializationForm completedWorklets={completedWorklets} onAdd={handleAddItem} onCancel={() => setModalType(null)} />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <LeftSidebar />
      <div className="flex-1 p-4 lg:p-8">
        <div className="w-full max-w-none mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-black dark:text-white">My Portfolio</h1>
            <p className="text-gray-600 dark:text-gray-300">Research outputs, achievements, and commercialization records.</p>
          </div>

          {loadingPortfolio && (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading portfolio...</div>
          )}
          {portfolioError && (
            <div className="text-center py-4 mb-6 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded">
              {portfolioError}
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Papers</p>
                  <p className="text-3xl font-bold mt-2">{portfolioData.papers.length}</p>
                </div>
                <FileText className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Patents</p>
                  <p className="text-3xl font-bold mt-2">{portfolioData.patents.length}</p>
                </div>
                <Shield className="h-12 w-12 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Commercializations</p>
                  <p className="text-3xl font-bold mt-2">{portfolioData.commercializations.length}</p>
                </div>
                <Target className="h-12 w-12 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Achievements</p>
                  <p className="text-3xl font-bold mt-2">{portfolioData.achievements.length}</p>
                </div>
                <Trophy className="h-12 w-12 text-yellow-200" />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-center border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-300 ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}>
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            {activeTab === 'achievements' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Awards & Recognitions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolioData.achievements.map((achievement) => {
                    const Icon = achievementIcon(achievement.type)
                    return (
                      <div
                        key={achievement.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-3 rounded-lg">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                            {achievement.year}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full ${
                              achievement.type === 'Award'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                            {achievement.type}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {portfolioData.achievements.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      No achievements added yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'papers' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Publications</h2>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Search papers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full sm:w-64"
                      />
                    </div>
                    <button
                      onClick={() => setModalType('paper')}
                      disabled={completedWorklets.length === 0}
                      title={completedWorklets.length === 0 ? 'You need at least one completed worklet to add papers.' : 'Add a new paper'}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-all duration-300 whitespace-nowrap ${completedWorklets.length === 0 ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      <PlusCircle size={18} />
                      <span>Add Paper</span>
                    </button>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Title</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                            Journal
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Year</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Worklet</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                            Preview
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioData.papers
                          .filter((paper) => {
                            if (!searchQuery) return true
                            const query = searchQuery.toLowerCase()
                            return (
                              paper.title?.toLowerCase().includes(query) ||
                              paper.journal?.toLowerCase().includes(query) ||
                              paper.authors?.some((author) => author.name?.toLowerCase().includes(query)) ||
                              paper.worklet_cert_id?.toLowerCase().includes(query)
                            )
                          })
                          .map((paper) => (
                            <React.Fragment key={paper.id}>
                              <tr
                                onClick={() => toggleRowExpansion('papers', paper.id)}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer ${
                                  expandedRows[`papers-${paper.id}`] ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}>
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    {expandedRows[`papers-${paper.id}`] ? (
                                      <ChevronUp size={16} className="mr-3 text-gray-500" />
                                    ) : (
                                      <ChevronDown size={16} className="mr-3 text-gray-500" />
                                    )}
                                    <div>
                                      <div className="font-semibold text-gray-900 dark:text-white">{paper.title}</div>
                                      <div className="text-xs text-gray-500">
                                        {Array.isArray(paper.authors)
                                          ? paper.authors.map((a) => a.name).join(', ')
                                          : paper.authors}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{paper.journal}</td>
                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{paper.year}</td>
                                <td className="px-6 py-4">
                                  {paper.worklet_cert_id ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/worklet/${paper.worklet_id}`)
                                      }}
                                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1">
                                      {paper.worklet_cert_id}
                                      <ExternalLink size={14} />
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      paper.status === 'Published'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}>
                                    {paper.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {paper.previewUrl ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewUrl(paper.previewUrl)
                                      }}
                                      className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                      <Eye size={16} />
                                      Preview
                                    </button>
                                  ) : paper.link && paper.link !== '#' ? (
                                    <a
                                      href={paper.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                                      <ExternalLink size={16} />
                                    </a>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                  )}
                                </td>
                              </tr>
                              {expandedRows[`papers-${paper.id}`] && (
                                <tr>
                                  <td colSpan="6" className="p-4 bg-gray-50 dark:bg-gray-900/50">
                                    <div className="px-4 py-2">
                                      <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">Abstract</h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">{paper.abstract || 'No abstract provided.'}</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {portfolioData.papers.filter((paper) => {
                    if (!searchQuery) return true
                    const query = searchQuery.toLowerCase()
                    return (
                      paper.title?.toLowerCase().includes(query) ||
                      paper.journal?.toLowerCase().includes(query) ||
                      paper.authors?.some((author) => author.name?.toLowerCase().includes(query)) ||
                      paper.worklet_cert_id?.toLowerCase().includes(query)
                    )
                  }).length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-gray-600 dark:text-gray-400">
                        {searchQuery ? `No papers found matching "${searchQuery}"` : 'No papers added yet. Click "Add Paper" to get started.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'patents' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Patents</h2>
                  <button
                    onClick={() => setModalType('patent')}
                    disabled={completedWorklets.length === 0}
                    title={completedWorklets.length === 0 ? 'You need at least one completed worklet to add patents.' : 'Add a new patent'}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ${completedWorklets.length === 0 ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    <PlusCircle size={18} />
                    <span>Add Patent</span>
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Title</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                            Application #
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                            Filing Year
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Worklet</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                            Preview
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioData.patents.map((patent) => (
                          <React.Fragment key={patent.id}>
                            <tr
                              onClick={() => toggleRowExpansion('patents', patent.id)}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer ${
                                expandedRows[`patents-${patent.id}`] ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  {expandedRows[`patents-${patent.id}`] ? (
                                    <ChevronUp size={16} className="mr-3 text-gray-500" />
                                  ) : (
                                    <ChevronDown size={16} className="mr-3 text-gray-500" />
                                  )}
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{patent.title}</div>
                                    <div className="text-xs text-gray-500">
                                      {Array.isArray(patent.inventors)
                                        ? patent.inventors.map((inv) => inv.name).join(', ')
                                        : patent.inventors}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                                {patent.application_number || '—'}
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                {patent.filing_year || '—'}
                              </td>
                              <td className="px-6 py-4">
                                {patent.worklet_cert_id ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigate(`/worklet/${patent.worklet_id}`)
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1">
                                    {patent.worklet_cert_id}
                                    <ExternalLink size={14} />
                                  </button>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    patent.status === 'Filed'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }`}>
                                  {patent.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {patent.previewUrl ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPreviewUrl(patent.previewUrl)
                                    }}
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                    <Eye size={16} />
                                    Preview
                                  </button>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">—</span>
                                )}
                              </td>
                            </tr>
                            {expandedRows[`patents-${patent.id}`] && (
                              <tr>
                                <td colSpan="6" className="p-4 bg-gray-50 dark:bg-gray-900/50">
                                  <div className="px-4 py-2">
                                      <h4 className="font-semibold text-sm mb-2 text-gray-800 dark:text-gray-200">Description</h4>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">{patent.description || 'No description provided.'}</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'commercializations' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Commercializations</h2>
                  <button
                    onClick={() => setModalType('commercialization')}
                    disabled={completedWorklets.length === 0}
                    title={completedWorklets.length === 0 ? 'You need at least one completed worklet to add commercialization records.' : 'Add a commercialization record'}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg shadow-md transition-all duration-300 ${completedWorklets.length === 0 ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    <PlusCircle size={18} />
                    <span>Add Record</span>
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                            Commercialization ID
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Title</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Year</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                            Associated Worklet
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Target (Link)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioData.commercializations.map((item) => (
                          <tr
                            key={item.id}
                            className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">
                              COMM-{item.id}
                            </td>
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.title}</td>
                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.year}</td>
                            <td className="px-6 py-4">
                              {item.worklet_cert_id ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/worklet/${item.worklet_id}`)
                                  }}
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1">
                                  {item.worklet_cert_id}
                                  <ExternalLink size={14} />
                                </button>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {item.link && item.link !== '#' ? (
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                                  <ExternalLink size={16} />
                                </a>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {portfolioData.commercializations.length === 0 && (
                    <div className="text-center py-12">
                      <Target className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-gray-600 dark:text-gray-400">
                        No commercializations added yet. Click "Add Record" to get started.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={`Add New ${modalType?.charAt(0).toUpperCase() + modalType?.slice(1)}`}>
        {renderModalContent()}
      </Modal>

      <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  )
}

export default Portfolio
import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import LeftSidebar from '../components/Left'

// --- MOCK API FUNCTIONS ---
const MOCK_API_LATENCY = 1000

const apiSubmit = async (endpoint, formData, isMultipart = false) => {
  console.log(`Submitting to ${endpoint}:`)
  for (let [key, value] of formData.entries()) {
    console.log(key, value)
  }

  await new Promise((resolve) => setTimeout(resolve, MOCK_API_LATENCY))

  const data = {}
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      data[key] = value.name
      data.previewUrl = URL.createObjectURL(value)
    } else if (key === 'authors' || key === 'inventors') {
      data[key] = JSON.parse(value)
    } else {
      data[key] = value
    }
  }
  return { ...data, id: Date.now() }
}

// --- STATIC DATA ---
const staticPortfolioData = {
  mentor: { id: 1, name: 'Dr. Static Mentor' },
  achievements: [
    {
      id: 1,
      title: 'Innovator of the Year',
      description: 'Awarded for pioneering work in decentralized applications.',
      type: 'Award',
      year: 2024,
    },
    {
      id: 2,
      title: 'Top Rated Speaker at TechCon 2023',
      description: 'Recognized for an engaging presentation on modern frontend frameworks.',
      type: 'Recognition',
      year: 2023,
    },
  ],
  papers: [
    {
      id: 1,
      title: 'The Future of Asynchronous State Management',
      authors: [{ name: 'Jane Doe' }, { name: 'John Smith' }],
      journal: 'Journal of Modern Web Development',
      year: 2023,
      status: 'Published',
      link: '#',
      abstract:
        'This paper explores advanced patterns for managing asynchronous state in large-scale React applications, proposing a novel hook-based approach.',
      doi: '10.1234/jMWD.2023.5678',
      publication_year: 2023,
    },
  ],
  patents: [
    {
      id: 1,
      title: 'System for Real-Time Collaborative Code Editing',
      inventors: [{ name: 'Jane Doe' }],
      application_number: 'US-2023-XYZ',
      filing_year: 2023,
      status: 'Filed',
      description:
        'A patented system that utilizes operational transforms to allow multiple users to edit the same codebase simultaneously with zero latency.',
      stage: 'Application Review',
    },
    // Example of a patent with string data to test resilient rendering
    {
      id: 2,
      title: 'Legacy Patent Entry',
      inventors: 'Dr. Old System',
      application_number: 'US-2019-ABC',
      filing_year: 2019,
      status: 'Granted',
      description: 'An older patent whose inventor data is a string.',
    },
  ],
  commercializations: [
    {
      id: 1,
      title: 'DevSync Pro',
      description:
        'A commercial product based on the real-time collaborative editing patent, licensed to major tech companies.',
      year: 2024,
      revenue: 50000,
      link: '#',
    },
  ],
  stats: null,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center border-b pb-3 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            disabled={children.props.isSubmitting}>
            <X size={24} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

const PreviewModal = ({ url, onClose }) => {
  if (!url) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b p-3 dark:border-gray-600 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Preview</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 flex-grow">
          <iframe src={url} className="w-full h-full border-0" title="File Preview" />
        </div>
      </div>
    </div>
  )
}

// --- IMPROVED FORMS ---
const AddPaperForm = ({ onAdd, onCancel }) => {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { authors: [{ name: '' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'authors' })

  const onSubmit = async (data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      if (key === 'authors') formData.append(key, JSON.stringify(data[key].filter((a) => a.name)))
      else formData.append(key, data[key])
    })
    if (file) formData.append('document', file)
    try {
      const newPaper = await apiSubmit('papers', formData, true)
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
            <BookUser size={20} className="mr-2 text-blue-500" /> Core Information
          </h4>
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
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center">
              Next <ArrowRight size={16} className="ml-2" />
            </button>
          </div>
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
          <Textarea name="abstract" register={register} errors={errors} placeholder="Abstract" rows="4" />
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

const AddPatentForm = ({ onAdd, onCancel }) => {
  const [file, setFile] = useState(null)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { inventors: [{ name: '' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'inventors' })

  const onSubmit = async (data) => {
    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      if (key === 'inventors') formData.append(key, JSON.stringify(data[key].filter((inv) => inv.name)))
      else formData.append(key, data[key])
    })
    if (file) formData.append('document', file)
    try {
      const newPatent = await apiSubmit('patents', formData, true)
      onAdd('patents', newPatent)
    } catch (error) {
      console.error('Submission failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
        <Lightbulb size={20} className="mr-2 text-yellow-500" /> Patent Details
      </h4>
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
      <Textarea name="description" register={register} errors={errors} placeholder="Brief Description" rows="3" />
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
    </form>
  )
}

const AddCommercializationForm = ({ onAdd, onCancel }) => {
  const [file, setFile] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    const formData = new FormData()
    const payload = { ...data, revenue: parseFloat(data.revenue) || 0 }
    Object.keys(payload).forEach((key) => formData.append(key, payload[key]))
    if (file) formData.append('document', file)
    try {
      const newRecord = await apiSubmit('commercializations', formData, true)
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
      <Input
        name="title"
        register={register}
        errors={errors}
        placeholder="Product/Service Title"
        {...register('title', { required: 'Title is required' })}
      />
      <div className="flex gap-4">
        <Input
          name="year"
          type="number"
          register={register}
          errors={errors}
          placeholder="Year"
          defaultValue={new Date().getFullYear()}
        />
        <Input
          name="revenue"
          type="number"
          step="0.01"
          register={register}
          errors={errors}
          placeholder="Revenue (USD)"
        />
      </div>
      <Input name="link" register={register} errors={errors} placeholder="Product Link (e.g., https://...)" />
      <Textarea name="description" register={register} errors={errors} placeholder="Description" rows="3" />
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center pt-2">
        <Upload size={20} className="mr-2 text-green-500" /> Proof/Document
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
          {isSubmitting ? 'Submitting...' : 'Add Record'}
        </button>
      </div>
    </form>
  )
}

// --- MAIN PORTFOLIO COMPONENT ---
const Portfolio = () => {
  const [activeTab, setActiveTab] = useState('achievements')
  const [expandedRows, setExpandedRows] = useState({})
  const [portfolioData, setPortfolioData] = useState(staticPortfolioData)
  const [loadingPortfolio, setLoadingPortfolio] = useState(false)
  const [portfolioError, setPortfolioError] = useState(null)
  const [modalType, setModalType] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // This would fetch real data in a production app
  useEffect(() => {
    // setLoadingPortfolio(true);
    // fetch(...)
    //   .then(res => res.json())
    //   .then(data => setPortfolioData(data))
    //   .catch(err => setPortfolioError(err.message))
    //   .finally(() => setLoadingPortfolio(false));
  }, [])

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
        return <AddPaperForm onAdd={handleAddItem} onCancel={() => setModalType(null)} />
      case 'patent':
        return <AddPatentForm onAdd={handleAddItem} onCancel={() => setModalType(null)} />
      case 'commercialization':
        return <AddCommercializationForm onAdd={handleAddItem} onCancel={() => setModalType(null)} />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <LeftSidebar />
      <div className="flex-1 p-4 lg:p-8">
        <div className="w-full max-w-none mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-black dark:text-white">My Achievements</h1>
            <p className="text-gray-600 dark:text-gray-300">A showcase of my professional journey and contributions.</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Achievements rendering logic */}
              </div>
            )}

            {activeTab === 'papers' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Publications</h2>
                  <button
                    onClick={() => setModalType('paper')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300">
                    <PlusCircle size={18} />
                    <span>Add Paper</span>
                  </button>
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
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
                            Preview
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioData.papers.map((paper) => (
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
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
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
                            {expandedRows[`papers-${paper.id}`] && <tr>{/* Expanded row content */}</tr>}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'patents' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Patents</h2>
                  <button
                    onClick={() => setModalType('patent')}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300">
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
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                                    Preview
                                  </button>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">—</span>
                                )}
                              </td>
                            </tr>
                            {expandedRows[`patents-${patent.id}`] && <tr>{/* Expanded row content */}</tr>}
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
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300">
                    <PlusCircle size={18} />
                    <span>Add Record</span>
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  {/* Commercializations Table */}
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
import React, { useState, useEffect } from 'react'
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
import { renderAsync } from 'docx-preview'

// --- Merged API Submit function with real fetch logic ---
const apiSubmit = async (endpoint, formData) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('Authentication failed. No token found.');
  }

  const response = await fetch(`http://localhost:8000/api/portfolio/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to submit data: ${response.statusText}`);
  }

  const data = await response.json();

  // Handle file preview on successful upload
  for (let [key, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      // Add the generated blob URL for in-app previewing
      data.previewUrl = URL.createObjectURL(value);
      break; // Assuming only one file per submission
    }
  }

  return data;
};

// --- REUSABLE & IMPROVED COMPONENTS from first code block ---
const Input = ({ register, name, errors, ...rest }) => (
  <div className="w-full">
    <input {...register(name)} {...rest} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
    {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>}
  </div>
)
const Textarea = ({ register, name, errors, ...rest }) => (
  <div className="w-full">
    <textarea {...register(name)} {...rest} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
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
      className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        <div className="overflow-y-auto flex-grow p-6 pt-4">{children}</div>
      </div>
    </div>
  )
}
const PreviewModal = ({ url, onClose }) => {
  const [isDocx, setIsDocx] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const containerRef = React.useRef(null)

  React.useEffect(() => {
    if (!url) return
    let abort = false
    const tryRenderDocx = async () => {
      setIsLoading(true)
      setIsDocx(false)
      try {
        const isBlob = url.startsWith('blob:')
        const res = await fetch(url, isBlob ? undefined : { mode: 'cors' })
        const buf = await res.arrayBuffer()
        if (abort) return
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          await renderAsync(buf, containerRef.current, undefined, {
            className: 'docx-preview',
            inWrapper: true,
            ignoreFonts: true,
          })
          // If renderAsync succeeded, mark as docx
          setIsDocx(true)
        }
      } catch (e) {
        // on failure, fallback to iframe by keeping isDocx=false
        setIsDocx(false)
      } finally {
        setIsLoading(false)
      }
    }

    tryRenderDocx()
    return () => {
      abort = true
    }
  }, [url])

  if (!url) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b p-3 dark:border-gray-600 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Document Preview</h3>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 text-sm px-3 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Open in new tab">
              <ExternalLink size={16} />
              <span>Open in New Tab</span>
            </a>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
        </div>
        <div className="flex-grow bg-gray-200 dark:bg-gray-900 p-1 relative">
          {isDocx ? (
            <div className="w-full h-full overflow-auto bg-white rounded-b-lg">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
                </div>
              )}
              <div ref={containerRef} className="min-h-full" />
            </div>
          ) : (
            <iframe src={url} className="w-full h-full border-0 rounded-b-lg bg-white" title="File Preview" />
          )}
        </div>
      </div>
    </div>
  )
}

// --- IMPROVED FORMS adapted for backend submission ---
const AddPaperForm = ({ onAdd, onCancel }) => {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [completedWorklets, setCompletedWorklets] = useState([])
  const [loadingWorklets, setLoadingWorklets] = useState(true)
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
  
  useEffect(() => {
    // This is a mocked API call. In a real app, you would fetch this from your backend.
    const fetchCompletedWorklets = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800))
        const mockWorklets = [
          { id: 101, cert_id: 'WK-A1B2', title: 'Quantum Computing Simulation Framework' },
          { id: 102, cert_id: 'WK-C3D4', title: 'Decentralized Identity Management System' },
        ]
        setCompletedWorklets(mockWorklets)
      } catch (error) {
        console.error('Error fetching completed worklets:', error)
      } finally {
        setLoadingWorklets(false)
      }
    }
    fetchCompletedWorklets()
  }, [])
  
  const onSubmit = async (data) => {
    const formData = new FormData()
    // Use the keys from the second code block for consistency with backend
    formData.append('title', data.title);
    formData.append('journal', data.journal);
    formData.append('publication_year', data.year); // Changed key to match backend
    formData.append('doi', data.doi);
    formData.append('abstract', data.abstract);
    formData.append('authors', JSON.stringify(data.authors.filter((a) => a.name)));
    if (file) formData.append('document', file);
    
    // Worklet association logic
    if (data.worklet_id) {
      const selectedWorklet = completedWorklets.find((w) => w.id === parseInt(data.worklet_id));
      if (selectedWorklet) {
        formData.append('worklet_id', data.worklet_id);
        formData.append('worklet_cert_id', selectedWorklet.cert_id);
      }
    }

    try {
      const newPaper = await apiSubmit('papers', formData);
      onAdd('papers', newPaper);
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <BookUser size={20} className="mr-2 text-blue-500" /> Paper Details
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Associated Worklet (Optional)</label>
            <select
              {...register('worklet_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={loadingWorklets}>
              <option value="">Select a completed worklet</option>
              {completedWorklets.map((worklet) => (
                <option key={worklet.id} value={worklet.id}>
                  {worklet.cert_id} - {worklet.title}
                </option>
              ))}
            </select>
            {loadingWorklets && <p className="text-xs text-gray-500 mt-1">Loading worklets...</p>}
          </div>
          <Input name="title" register={register} errors={errors} placeholder="Paper Title" {...register('title', { required: 'Title is required' })} />
          <Input name="journal" register={register} errors={errors} placeholder="Journal / Conference" {...register('journal', { required: 'Journal is required' })} />
          <div className="flex gap-4">
            <Input name="year" type="number" register={register} errors={errors} placeholder="Year" defaultValue={new Date().getFullYear()} {...register('year', { required: 'Year is required' })} />
            <Input name="doi" register={register} errors={errors} placeholder="DOI (e.g., 10.xxxx/xxxx)" />
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center">
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
                <Input name={`authors.${index}.name`} register={register} errors={errors} placeholder={`Author ${index + 1} Name`} {...register(`authors.${index}.name`, { required: 'Author name is required' })} />
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => append({ name: '' })} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              + Add Author
            </button>
          </div>
          <Textarea name="abstract" register={register} errors={errors} placeholder="Abstract" rows="4" />
          <div className="flex justify-between pt-4">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 flex items-center">
              <ArrowLeft size={16} className="mr-2" /> Previous
            </button>
            <button type="button" onClick={() => setStep(3)} className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center">
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
            <button type="button" onClick={() => setStep(2)} className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 flex items-center" disabled={isSubmitting}>
              <ArrowLeft size={16} className="mr-2" /> Previous
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center" disabled={isSubmitting}>
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
    // Use the keys from the second code block for consistency with backend
    formData.append('title', data.title);
    formData.append('application_number', data.application_number);
    formData.append('filing_year', data.filing_year);
    formData.append('status', data.status || 'Filed'); // Added status field
    formData.append('description', data.description);
    formData.append('inventors', JSON.stringify(data.inventors.filter((inv) => inv.name)));
    if (file) formData.append('document', file);

    try {
      const newPatent = await apiSubmit('patents', formData);
      onAdd('patents', newPatent);
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
        <Lightbulb size={20} className="mr-2 text-yellow-500" /> Patent Details
      </h4>
      <Input name="title" register={register} errors={errors} placeholder="Patent Title" {...register('title', { required: 'Title is required' })} />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Inventors</label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2 mb-2">
            <Input name={`inventors.${index}.name`} register={register} errors={errors} placeholder={`Inventor ${index + 1} Name`} {...register(`inventors.${index}.name`, { required: 'Inventor name is required' })} />
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => append({ name: '' })} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          + Add Inventor
        </button>
      </div>
      <div className="flex gap-4">
        <Input name="application_number" register={register} errors={errors} placeholder="Application Number" {...register('application_number', { required: 'Application number is required' })} />
        <Input name="filing_year" type="number" register={register} errors={errors} placeholder="Filing Year" defaultValue={new Date().getFullYear()} {...register('filing_year', { required: 'Filing year is required' })} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
        <select {...register('status')} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <option value="Filed">Filed</option>
          <option value="Granted">Granted</option>
          <option value="Published">Published</option>
        </select>
      </div>
      <Textarea name="description" register={register} errors={errors} placeholder="Brief Description" rows="3" />
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center pt-2">
        <Upload size={20} className="mr-2 text-yellow-500" /> Supporting Document
      </h4>
      <FileUpload onFileChange={setFile} file={file} />
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center" disabled={isSubmitting}>
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
    // Use the keys from the second code block for consistency with backend
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('year', data.year);
    formData.append('revenue', data.revenue);
    formData.append('link', data.link);
    if (file) formData.append('document', file);

    try {
      const newRecord = await apiSubmit('commercializations', formData);
      onAdd('commercializations', newRecord);
    } catch (error) {
      console.error('Submission failed', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
        <Target size={20} className="mr-2 text-green-500" /> Commercialization Record
      </h4>
      <Input name="title" register={register} errors={errors} placeholder="Product/Service Title" {...register('title', { required: 'Title is required' })} />
      <div className="flex gap-4">
        <Input name="year" type="number" register={register} errors={errors} placeholder="Year" defaultValue={new Date().getFullYear()} {...register('year', { required: 'Year is required' })} />
        <Input name="revenue" type="number" step="0.01" register={register} errors={errors} placeholder="Revenue (USD)" />
      </div>
      <Input name="link" register={register} errors={errors} placeholder="Product Link (e.g., https://...)" />
      <Textarea name="description" register={register} errors={errors} placeholder="Description" rows="3" />
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center pt-2">
        <Upload size={20} className="mr-2 text-green-500" /> Proof/Document
      </h4>
      <FileUpload onFileChange={setFile} file={file} />
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500" disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          {isSubmitting ? 'Submitting...' : 'Add Record'}
        </button>
      </div>
    </form>
  )
}

// --- MAIN PORTFOLIO COMPONENT (Merged) ---
const Portfolio = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('achievements')
  const [expandedRows, setExpandedRows] = useState({})
  // Use the state initialization from the backend-integrated code
  const [portfolioData, setPortfolioData] = useState({
    mentor: null,
    achievements: [],
    papers: [],
    patents: [],
    commercializations: [],
    stats: null,
  });
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [portfolioError, setPortfolioError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('')
  const [modalType, setModalType] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // --- Backend data fetching logic from the second code block ---
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoadingPortfolio(true);
        setPortfolioError(null);
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Not authenticated');
        }
        const resp = await fetch('http://localhost:8000/api/portfolio/student/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!resp.ok) {
          throw new Error(`Failed to load portfolio data (HTTP ${resp.status})`);
        }
        const data = await resp.json();
        setPortfolioData({
          mentor: data.mentor ?? null,
          achievements: Array.isArray(data.achievements) ? data.achievements : [],
          papers: Array.isArray(data.papers) ? data.papers : [],
          patents: Array.isArray(data.patents) ? data.patents : [],
          commercializations: Array.isArray(data.commercializations) ? data.commercializations : [],
          stats: data.stats ?? null,
        });
      } catch (err) {
        setPortfolioError(err.message || 'Failed to load portfolio data');
      } finally {
        setLoadingPortfolio(false);
      }
    };
    fetchPortfolio();
  }, []);

  // --- Blob URL cleanup from first code block ---
  useEffect(() => {
    return () => {
      const allItems = [...portfolioData.papers, ...portfolioData.patents, ...portfolioData.commercializations];
      allItems.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [portfolioData]);

  const achievementIcon = (type) => (type === 'Award' ? Trophy : Star)
  const toggleRowExpansion = (section, id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [`${section}-${id}`]: !prev[`${section}-${id}`],
    }))
  }

  // --- Merged handleAddItem function to work with both UI and backend state ---
  const handleAddItem = (section, newItem) => {
    setPortfolioData((prevData) => {
      const updatedSection = [...prevData[section], newItem];
      return {
        ...prevData,
        [section]: updatedSection,
        stats: {
          ...prevData.stats,
          [`${section}_count`]: updatedSection.length
        }
      };
    });
    setModalType(null);
  };

  const tabs = [
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'papers', label: 'Papers', icon: FileText },
    { id: 'patents', label: 'Patents', icon: Shield },
    { id: 'commercializations', label: 'Commercializations', icon: Target },
  ];

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
  };

  const filteredPapers = portfolioData.papers.filter((paper) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    // Using keys from the backend data
    return paper.title?.toLowerCase().includes(query) || paper.journal?.toLowerCase().includes(query) || (Array.isArray(paper.authors) && paper.authors.some((author) => author.name?.toLowerCase().includes(query))) || paper.worklet_cert_id?.toLowerCase().includes(query)
  });

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <LeftSidebar />
      <div className="flex-1 p-4 lg:p-8">
        <div className="w-full max-w-none mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-black dark:text-white">My Achievements</h1>
            <p className="text-gray-600 dark:text-gray-300">A showcase of my professional journey and contributions.</p>
          </div>

          {/* Add error message display */}
          {portfolioError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
              {portfolioError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Papers</p>
                  <p className="text-3xl font-bold mt-2">{portfolioData.stats?.papers_count ?? portfolioData.papers.length}</p>
                </div>
                <FileText className="h-12 w-12 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Patents</p>
                  <p className="text-3xl font-bold mt-2">{portfolioData.stats?.patents_count ?? portfolioData.patents.length}</p>
                </div>
                <Shield className="h-12 w-12 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Commercializations</p>
                  <p className="text-3xl font-bold mt-2">{portfolioData.stats?.commercializations_count ?? portfolioData.commercializations.length}</p>
                </div>
                <Target className="h-12 w-12 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Achievements</p>
                  <p className="text-3xl font-bold mt-2">{portfolioData.stats?.achievements_count ?? portfolioData.achievements.length}</p>
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
                  className={`relative flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors duration-300 ${activeTab === tab.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'}`}>
                  <tab.icon size={18} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            {loadingPortfolio && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                    <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            )}
            {!loadingPortfolio && activeTab === 'achievements' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Awards & Recognitions</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolioData.achievements.map((achievement) => {
                    const Icon = achievementIcon(achievement.type);
                    return (
                      <div key={achievement.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`p-3 rounded-lg bg-gradient-to-br ${
                              achievement.type === 'Award' ? 'from-yellow-400 to-yellow-600' : 'from-pink-400 to-pink-600'
                            }`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{achievement.year}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{achievement.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{achievement.description}</p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <span
                            className={`text-xs font-medium px-3 py-1 rounded-full ${
                              achievement.type === 'Award' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                            {achievement.type}
                          </span>
                          {achievement.link && (
                            <a href={achievement.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1">
                              View <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {portfolioData.achievements.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                    <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">No achievements added yet.</p>
                  </div>
                )}
              </div>
            )}
            {!loadingPortfolio && activeTab === 'papers' && (
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
                    <button onClick={() => setModalType('paper')} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 whitespace-nowrap">
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
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Journal</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Year</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Worklet</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPapers.map((paper) => (
                          <React.Fragment key={paper.id}>
                            <tr
                              onClick={() => toggleRowExpansion('papers', paper.id)}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer ${expandedRows[`papers-${paper.id}`] ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  {expandedRows[`papers-${paper.id}`] ? <ChevronUp size={16} className="mr-3 text-gray-500" /> : <ChevronDown size={16} className="mr-3 text-gray-500" />}
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{paper.title}</div>
                                    <div className="text-xs text-gray-500">{Array.isArray(paper.authors) ? paper.authors.map((a) => a.name).join(', ') : paper.authors}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{paper.journal || '—'}</td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{paper.publication_year ?? '—'}</td>
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
                                    paper.status === 'Published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  }`}>
                                  {paper.status || 'Pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {(paper.previewUrl || paper.document_link) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPreviewUrl(paper.previewUrl || paper.document_link)
                                    }}
                                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                                    title="Preview Document">
                                    <Eye size={16} />
                                  </button>
                                )}
                                {paper.link && paper.link !== '#' && !paper.document_link && (
                                  <a href={paper.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                                    <ExternalLink size={16} />
                                  </a>
                                )}
                              </td>
                            </tr>
                            {expandedRows[`papers-${paper.id}`] && (
                              <tr>
                                <td colSpan="6" className="p-0">
                                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                                    <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Abstract</h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-xs mb-3">{paper.abstract || 'No abstract available.'}</p>
                                    {paper.doi && (
                                      <p className="text-xs">
                                        <strong className="text-gray-700 dark:text-gray-300">DOI:</strong>{' '}
                                        <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                          {paper.doi}
                                        </a>
                                      </p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredPapers.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-4 text-gray-600 dark:text-gray-400">{searchQuery ? `No papers found matching "${searchQuery}"` : 'No papers added yet. Click "Add Paper" to get started.'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {!loadingPortfolio && activeTab === 'patents' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Patents</h2>
                  <button onClick={() => setModalType('patent')} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300">
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
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Application #</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Filing Year</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
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
                                  {expandedRows[`patents-${patent.id}`] ? <ChevronUp size={16} className="mr-3 text-gray-500" /> : <ChevronDown size={16} className="mr-3 text-gray-500" />}
                                  <div>
                                    <div className="font-semibold text-gray-900 dark:text-white">{patent.title}</div>
                                    <div className="text-xs text-gray-500">{Array.isArray(patent.inventors) ? patent.inventors.map((inv) => inv.name).join(', ') : patent.inventors}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300 font-mono text-xs">{patent.application_number || '—'}</td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{patent.filing_year || '—'}</td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    patent.status === 'Granted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  }`}>
                                  {patent.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {(patent.previewUrl || patent.document_link) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPreviewUrl(patent.previewUrl || patent.document_link)
                                    }}
                                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                                    title="Preview Document">
                                    <Eye size={16} />
                                  </button>
                                )}
                                {patent.link && patent.link !== '#' && !patent.document_link && (
                                  <a href={patent.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                                    <ExternalLink size={16} />
                                  </a>
                                )}
                              </td>
                            </tr>
                            {expandedRows[`patents-${patent.id}`] && (
                              <tr>
                                <td colSpan="5" className="p-0">
                                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                                    <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Description</h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-xs">{patent.description || 'No description available.'}</p>
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
            {!loadingPortfolio && activeTab === 'commercializations' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">Commercializations</h2>
                  <button onClick={() => setModalType('commercialization')} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300">
                    <PlusCircle size={18} />
                    <span>Add Record</span>
                  </button>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Product/Service</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Year</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Revenue (USD)</th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioData.commercializations.map((item) => (
                          <React.Fragment key={item.id}>
                            <tr
                              onClick={() => toggleRowExpansion('commercializations', item.id)}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer ${
                                expandedRows[`commercializations-${item.id}`] ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                              }`}>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  {expandedRows[`commercializations-${item.id}`] ? <ChevronUp size={16} className="mr-3 text-gray-500" /> : <ChevronDown size={16} className="mr-3 text-gray-500" />}
                                  <div className="font-semibold text-gray-900 dark:text-white">{item.title}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.year}</td>
                              <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.revenue?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || 'N/A'}</td>
                              <td className="px-6 py-4 flex items-center space-x-2">
                                {item.link && item.link !== '#' && (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                                    title="Visit Link">
                                    <ExternalLink size={16} />
                                  </a>
                                )}
                                {(item.previewUrl || item.document_link) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setPreviewUrl(item.previewUrl || item.document_link)
                                    }}
                                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300"
                                    title="Preview Document">
                                    <Eye size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                            {expandedRows[`commercializations-${item.id}`] && (
                              <tr>
                                <td colSpan="4" className="p-0">
                                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                                    <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Description</h4>
                                    <p className="text-gray-600 dark:text-gray-300 text-xs">{item.description || 'No description available.'}</p>
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
          </div>
        </div>
      </div>
      <Modal isOpen={!!modalType} onClose={() => setModalType(null)} title={`Add New ${modalType?.charAt(0).toUpperCase() + modalType?.slice(1)}`}>
        {renderModalContent()}
      </Modal>
      <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </div>
  )
}
export default Portfolio
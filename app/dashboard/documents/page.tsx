"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Upload, 
  Camera, 
  Scan,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileImage,
  GraduationCap,
  Award
} from "lucide-react"

interface ExtractedDocument {
  id: string
  document_type: "certificate" | "marksheet" | "report" | "other"
  name: string
  extracted_data: Record<string, string>
  uploaded_at: string
  status: "pending" | "processing" | "completed" | "error"
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ExtractedDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })
      
      if (data) {
        setDocuments(data)
      }
    }
    setLoading(false)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Please upload an image or PDF file")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    const docType = detectDocumentType(file.name)

    // Create document record in database
    const { data: newDoc, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        name: file.name,
        document_type: docType,
        status: "processing",
        extracted_data: {},
      })
      .select()
      .single()

    if (error || !newDoc) {
      clearInterval(progressInterval)
      setIsUploading(false)
      setUploadProgress(0)
      alert("Failed to upload document")
      return
    }

    setDocuments(prev => [newDoc, ...prev])

    // Simulate OCR completion
    setTimeout(async () => {
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const extractedData = simulateOCRExtraction(docType)
      
      // Update document with extracted data
      const { data: updatedDoc } = await supabase
        .from("documents")
        .update({ 
          status: "completed", 
          extracted_data: extractedData 
        })
        .eq("id", newDoc.id)
        .select()
        .single()

      if (updatedDoc) {
        setDocuments(prev => prev.map(doc => 
          doc.id === newDoc.id ? updatedDoc : doc
        ))
      }
      
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    }, 2000)
  }

  const detectDocumentType = (filename: string): ExtractedDocument["document_type"] => {
    const lower = filename.toLowerCase()
    if (lower.includes("certificate") || lower.includes("cert")) return "certificate"
    if (lower.includes("mark") || lower.includes("result") || lower.includes("grade")) return "marksheet"
    if (lower.includes("report")) return "report"
    return "other"
  }

  const simulateOCRExtraction = (type: ExtractedDocument["document_type"]) => {
    switch (type) {
      case "certificate":
        return {
          "Certificate Type": "Course Completion",
          "Issued By": "ABC Institute of Technology",
          "Course Name": "Data Science Fundamentals",
          "Completion Date": "March 2024",
          "Duration": "6 months",
        }
      case "marksheet":
        return {
          "Examination": "Class 12 Board Exam",
          "Year": "2024",
          "Total Marks": "485/500",
          "Percentage": "97%",
          "Grade": "A+",
        }
      case "report":
        return {
          "Report Type": "Academic Progress Report",
          "Period": "Semester 1",
          "Overall Grade": "A",
          "Remarks": "Excellent performance",
        }
      default:
        return {
          "Document Type": "General Document",
          "Status": "Processed",
        }
    }
  }

  const removeDocument = async (id: string) => {
    await supabase.from("documents").delete().eq("id", id)
    setDocuments(prev => prev.filter(doc => doc.id !== id))
  }

  const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    certificate: Award,
    marksheet: GraduationCap,
    report: FileText,
    other: FileImage,
  }

  const typeColors: Record<string, string> = {
    certificate: "bg-amber-500",
    marksheet: "bg-blue-500",
    report: "bg-green-500",
    other: "bg-gray-500",
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document Scanner</h1>
        <p className="text-muted-foreground">
          Upload academic documents and let AI extract key information automatically
        </p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileInput}
              className="hidden"
            />

            {isUploading ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Scan className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Processing document...</p>
                  <Progress value={uploadProgress} className="mx-auto max-w-xs h-2" />
                  <p className="text-sm text-muted-foreground">
                    {uploadProgress < 50 ? "Uploading..." : uploadProgress < 90 ? "Extracting text..." : "Analyzing..."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Upload a document</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Drag and drop or click to upload certificates, marksheets, or reports
                </p>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, PDF (max 10MB)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Features Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Scan, title: "Smart OCR", description: "AI-powered text extraction from images and PDFs" },
          { icon: FileText, title: "Auto-Categorize", description: "Automatically detects document type" },
          { icon: CheckCircle2, title: "Data Extraction", description: "Extracts grades, dates, and key information" },
        ].map((feature) => (
          <Card key={feature.title}>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Processed Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processed Documents</CardTitle>
            <CardDescription>
              Your uploaded documents and extracted information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.map((doc) => {
              const Icon = typeIcons[doc.document_type] || FileImage
              const color = typeColors[doc.document_type] || "bg-gray-500"
              const extractedData = doc.extracted_data || {}
              
              return (
                <div
                  key={doc.id}
                  className="rounded-lg border border-border p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{doc.name}</h4>
                          <Badge variant="secondary" className="capitalize text-xs">
                            {doc.document_type}
                          </Badge>
                          {doc.status === "processing" && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {doc.status === "completed" && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {doc.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(doc.uploaded_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {doc.status === "completed" && Object.keys(extractedData).length > 0 && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Extracted Information
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(extractedData).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {documents.length === 0 && !isUploading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No documents yet</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Upload your academic documents to automatically extract and organize your achievements.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

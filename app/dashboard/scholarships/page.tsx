"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  GraduationCap,
  Search,
  Calendar,
  IndianRupee,
  Building2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"

interface Scholarship {
  id: string
  name: string
  provider: string
  amount: string
  deadline: string
  eligibility: {
    min_percentage?: number
    income_limit?: number
    gender?: string
    stream?: string[]
    category?: string[]
  }
  description: string
  application_url: string
  category: string
  education_level: string[]
}

interface UserScholarship {
  id: string
  scholarship_id: string
  status: "saved" | "applied" | "accepted" | "rejected"
  applied_at: string | null
  notes: string | null
}

const categoryColors: Record<string, string> = {
  merit: "bg-blue-500/10 text-blue-600 border-blue-200",
  "need-based": "bg-amber-500/10 text-amber-600 border-amber-200",
  women: "bg-pink-500/10 text-pink-600 border-pink-200",
  stem: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  research: "bg-violet-500/10 text-violet-600 border-violet-200",
}

const statusIcons: Record<string, React.ReactNode> = {
  saved: <Bookmark className="h-4 w-4" />,
  applied: <Clock className="h-4 w-4" />,
  accepted: <CheckCircle2 className="h-4 w-4" />,
  rejected: <AlertCircle className="h-4 w-4" />,
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [userScholarships, setUserScholarships] = useState<UserScholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const [scholarshipsRes, userScholarshipsRes] = await Promise.all([
      supabase.from("scholarships").select("*").order("deadline", { ascending: true }),
      user
        ? supabase.from("user_scholarships").select("*").eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
    ])

    if (scholarshipsRes.data) {
      setScholarships(scholarshipsRes.data)
    }
    if (userScholarshipsRes.data) {
      setUserScholarships(userScholarshipsRes.data)
    }
    setLoading(false)
  }

  const toggleSaveScholarship = async (scholarshipId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(scholarshipId)
    const existing = userScholarships.find((us) => us.scholarship_id === scholarshipId)

    if (existing) {
      await supabase.from("user_scholarships").delete().eq("id", existing.id)
      setUserScholarships(userScholarships.filter((us) => us.id !== existing.id))
    } else {
      const { data } = await supabase
        .from("user_scholarships")
        .insert({ user_id: user.id, scholarship_id: scholarshipId, status: "saved" })
        .select()
        .single()
      if (data) {
        setUserScholarships([...userScholarships, data])
      }
    }
    setSaving(null)
  }

  const updateScholarshipStatus = async (scholarshipId: string, status: string) => {
    const existing = userScholarships.find((us) => us.scholarship_id === scholarshipId)
    if (!existing) return

    const { data } = await supabase
      .from("user_scholarships")
      .update({ 
        status, 
        applied_at: status === "applied" ? new Date().toISOString() : existing.applied_at 
      })
      .eq("id", existing.id)
      .select()
      .single()

    if (data) {
      setUserScholarships(
        userScholarships.map((us) => (us.id === existing.id ? data : us))
      )
    }
  }

  const filteredScholarships = scholarships.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter
    const matchesLevel =
      levelFilter === "all" || s.education_level?.includes(levelFilter)
    return matchesSearch && matchesCategory && matchesLevel
  })

  const savedScholarships = filteredScholarships.filter((s) =>
    userScholarships.some((us) => us.scholarship_id === s.id)
  )

  const getDaysUntilDeadline = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const isScholarshipSaved = (scholarshipId: string) =>
    userScholarships.some((us) => us.scholarship_id === scholarshipId)

  const getScholarshipStatus = (scholarshipId: string) =>
    userScholarships.find((us) => us.scholarship_id === scholarshipId)?.status || null

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scholarships</h1>
        <p className="text-muted-foreground">
          Discover and track scholarship opportunities tailored for Indian students
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scholarships.length}</div>
            <p className="text-xs text-muted-foreground">Total scholarships</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saved</CardTitle>
            <Bookmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userScholarships.length}</div>
            <p className="text-xs text-muted-foreground">In your list</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applied</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userScholarships.filter((us) => us.status === "applied").length}
            </div>
            <p className="text-xs text-muted-foreground">Applications sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Closing Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scholarships.filter((s) => getDaysUntilDeadline(s.deadline) <= 30 && getDaysUntilDeadline(s.deadline) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search scholarships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="merit">Merit Based</SelectItem>
                <SelectItem value="need-based">Need Based</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="stem">STEM</SelectItem>
                <SelectItem value="research">Research</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <GraduationCap className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="11th">Class 11</SelectItem>
                <SelectItem value="12th">Class 12</SelectItem>
                <SelectItem value="undergraduate">Undergraduate</SelectItem>
                <SelectItem value="postgraduate">Postgraduate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scholarships List */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredScholarships.length})</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedScholarships.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="grid gap-4 md:grid-cols-2">
              {filteredScholarships.map((scholarship) => (
                <ScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                  isSaved={isScholarshipSaved(scholarship.id)}
                  status={getScholarshipStatus(scholarship.id)}
                  saving={saving === scholarship.id}
                  onToggleSave={() => toggleSaveScholarship(scholarship.id)}
                  onViewDetails={() => setSelectedScholarship(scholarship)}
                  daysUntilDeadline={getDaysUntilDeadline(scholarship.deadline)}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          {savedScholarships.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="mb-2 text-lg font-semibold">No saved scholarships</h3>
                <p className="text-sm text-muted-foreground">
                  Save scholarships you&apos;re interested in to track them here
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid gap-4 md:grid-cols-2">
                {savedScholarships.map((scholarship) => (
                  <ScholarshipCard
                    key={scholarship.id}
                    scholarship={scholarship}
                    isSaved={true}
                    status={getScholarshipStatus(scholarship.id)}
                    saving={saving === scholarship.id}
                    onToggleSave={() => toggleSaveScholarship(scholarship.id)}
                    onViewDetails={() => setSelectedScholarship(scholarship)}
                    onUpdateStatus={(status) => updateScholarshipStatus(scholarship.id, status)}
                    daysUntilDeadline={getDaysUntilDeadline(scholarship.deadline)}
                    showStatusUpdate
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={!!selectedScholarship} onOpenChange={() => setSelectedScholarship(null)}>
        <DialogContent className="max-w-2xl">
          {selectedScholarship && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedScholarship.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4" />
                      {selectedScholarship.provider}
                    </DialogDescription>
                  </div>
                  <Badge className={categoryColors[selectedScholarship.category] || "bg-muted"}>
                    {selectedScholarship.category}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {selectedScholarship.description}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-medium">{selectedScholarship.amount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="font-medium">
                        {new Date(selectedScholarship.deadline).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Eligibility</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedScholarship.eligibility?.min_percentage && (
                      <Badge variant="outline">
                        Min {selectedScholarship.eligibility.min_percentage}% marks
                      </Badge>
                    )}
                    {selectedScholarship.eligibility?.income_limit && (
                      <Badge variant="outline">
                        Family income under ₹{(selectedScholarship.eligibility.income_limit / 100000).toFixed(1)}L
                      </Badge>
                    )}
                    {selectedScholarship.eligibility?.gender && (
                      <Badge variant="outline">
                        {selectedScholarship.eligibility.gender === "female" ? "Women only" : selectedScholarship.eligibility.gender}
                      </Badge>
                    )}
                    {selectedScholarship.eligibility?.stream?.map((s) => (
                      <Badge key={s} variant="outline">{s}</Badge>
                    ))}
                    {selectedScholarship.eligibility?.category?.map((c) => (
                      <Badge key={c} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold">Education Levels</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedScholarship.education_level?.map((level) => (
                      <Badge key={level} variant="secondary">{level}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant={isScholarshipSaved(selectedScholarship.id) ? "secondary" : "outline"}
                    onClick={() => toggleSaveScholarship(selectedScholarship.id)}
                    disabled={saving === selectedScholarship.id}
                  >
                    {saving === selectedScholarship.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isScholarshipSaved(selectedScholarship.id) ? (
                      <BookmarkCheck className="mr-2 h-4 w-4" />
                    ) : (
                      <Bookmark className="mr-2 h-4 w-4" />
                    )}
                    {isScholarshipSaved(selectedScholarship.id) ? "Saved" : "Save"}
                  </Button>
                  <Button asChild className="flex-1">
                    <a
                      href={selectedScholarship.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Apply Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ScholarshipCard({
  scholarship,
  isSaved,
  status,
  saving,
  onToggleSave,
  onViewDetails,
  onUpdateStatus,
  daysUntilDeadline,
  showStatusUpdate,
}: {
  scholarship: Scholarship
  isSaved: boolean
  status: string | null
  saving: boolean
  onToggleSave: () => void
  onViewDetails: () => void
  onUpdateStatus?: (status: string) => void
  daysUntilDeadline: number
  showStatusUpdate?: boolean
}) {
  const isUrgent = daysUntilDeadline <= 14 && daysUntilDeadline > 0
  const isExpired = daysUntilDeadline <= 0

  return (
    <Card className={`transition-all hover:shadow-md ${isExpired ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-tight line-clamp-2">
              {scholarship.name}
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {scholarship.provider}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={onToggleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge className={categoryColors[scholarship.category] || "bg-muted"}>
            {scholarship.category}
          </Badge>
          {scholarship.education_level?.slice(0, 2).map((level) => (
            <Badge key={level} variant="outline" className="text-xs">
              {level}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <IndianRupee className="h-4 w-4" />
            {scholarship.amount}
          </span>
          <span
            className={`flex items-center gap-1 ${
              isExpired
                ? "text-muted-foreground"
                : isUrgent
                ? "text-amber-600 font-medium"
                : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-4 w-4" />
            {isExpired
              ? "Expired"
              : isUrgent
              ? `${daysUntilDeadline} days left`
              : new Date(scholarship.deadline).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
          </span>
        </div>

        {showStatusUpdate && status && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Select value={status} onValueChange={onUpdateStatus}>
              <SelectTrigger className="h-7 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

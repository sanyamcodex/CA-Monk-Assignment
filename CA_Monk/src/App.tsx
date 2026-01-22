import React, { useState } from "react"
import axios from "axios"
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

/* ---------------- SIMPLE UI COMPONENTS (shadcn-style) ---------------- */

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="bg-black text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
      {...props}
    >
      {props.children}
    </button>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full border rounded px-3 py-2"
      {...props}
    />
  )
}

function Card({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="border rounded-lg bg-white shadow-sm"
      {...props}
    >
      {children}
    </div>
  )
}

/* ---------------- TYPES ---------------- */

interface Blog {
  id: number
  title: string
  category: string[]
  description: string
  date: string
  coverImage: string
  content: string
}

/* ---------------- API ---------------- */

const API_URL = "http://localhost:3001/blogs"

const getBlogs = async (): Promise<Blog[]> => {
  const res = await axios.get(API_URL)
  return res.data
}

const getBlogById = async (id: number): Promise<Blog> => {
  const res = await axios.get(`${API_URL}/${id}`)
  return res.data
}

const createBlog = async (blog: Omit<Blog, "id">) => {
  const res = await axios.post(API_URL, blog)
  return res.data
}

/* ---------------- COMPONENTS ---------------- */

function BlogList({ onSelect }: { onSelect: (id: number) => void }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["blogs"],
    queryFn: getBlogs,
  })

  if (isLoading) return <p>Loading blogs...</p>
  if (error) return <p>Failed to load blogs</p>

  return (
    <div className="space-y-4">
      {data?.map((blog) => (
        <Card
          key={blog.id}
          onClick={() => onSelect(blog.id)}
          className="cursor-pointer hover:shadow-md transition p-4"
        >
          <p className="text-xs text-gray-500">
            {blog.category.join(", ")}
          </p>
          <h3 className="font-semibold text-lg">{blog.title}</h3>
          <p className="text-sm text-gray-600 mt-2">
            {blog.description}
          </p>
        </Card>
      ))}
    </div>
  )
}

function BlogDetail({ blogId }: { blogId: number | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => getBlogById(blogId as number),
    enabled: !!blogId,
  })

  if (!blogId) return <p>Select a blog to view details</p>
  if (isLoading) return <p>Loading blog...</p>

  return (
    <div>
      <img
        src={data?.coverImage}
        className="rounded-lg mb-4 w-full h-64 object-cover"
      />
      <h1 className="text-2xl font-bold mb-2">{data?.title}</h1>
      <p className="text-gray-700">{data?.content}</p>
    </div>
  )
}

function CreateBlogForm() {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")

  const { mutate, isLoading } = useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] })
      setTitle("")
    },
  })

  const handleCreate = () => {
    mutate({
      title,
      description: "Short blog description",
      category: ["TECH"],
      date: new Date().toISOString(),
      coverImage:
        "https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg",
      content:
        "This is the full blog content written in plain text as required.",
    })
  }

  return (
    <div className="space-y-2 mb-6">
      <Input
        placeholder="Blog title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button onClick={handleCreate} disabled={isLoading}>
        Create Blog
      </Button>
    </div>
  )
}

/* ---------------- MAIN APP ---------------- */

function BlogApp() {
  const [selectedBlog, setSelectedBlog] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      <div>
        <CreateBlogForm />
        <BlogList onSelect={setSelectedBlog} />
      </div>
      <div className="md:col-span-2">
        <BlogDetail blogId={selectedBlog} />
      </div>
    </div>
  )
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlogApp />
    </QueryClientProvider>
  )
}
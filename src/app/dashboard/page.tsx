"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  priority: string;
  status: string;
  categoryId: string | null;
};

type Category = {
  id: string;
  name: string;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  
  const [form, setForm] = useState({ title: "", description: "", deadline: "", priority: "MEDIUM", categoryId: "" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTasks();
      fetchCategories();
    }
  }, [status, search, filterPriority, filterStatus]);

  const fetchTasks = async () => {
    let url = "/api/tasks?";
    if (search) url += `search=${search}&`;
    if (filterPriority) url += `priority=${filterPriority}&`;
    if (filterStatus) url += `status=${filterStatus}&`;
    const res = await fetch(url);
    if (res.ok) setTasks(await res.json());
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      }),
    });
    setForm({ title: "", description: "", deadline: "", priority: "MEDIUM", categoryId: "" });
    fetchTasks();
  };

  const updateTaskStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    fetchTasks();
  };

  if (status === "loading") return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const progress = tasks.length === 0 ? 0 : (completedCount / tasks.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white p-4 shadow-md flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm sm:text-base">{session?.user?.email}</span>
          <button onClick={() => signOut()} className="bg-indigo-800 px-4 py-2 rounded hover:bg-indigo-900 transition text-sm sm:text-base">
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
            <div className="bg-green-500 h-4 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-600">{completedCount} of {tasks.length} tasks completed ({Math.round(progress)}%)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white rounded-xl shadow p-6 h-fit">
            <h2 className="text-xl font-bold mb-6">Create Task</h2>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input required className="w-full border rounded-lg p-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full border rounded-lg p-2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Deadline</label>
                <input type="datetime-local" className="w-full border rounded-lg p-2" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select className="w-full border rounded-lg p-2" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select className="w-full border rounded-lg p-2" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg p-2 hover:bg-indigo-700 transition">Add Task</button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow p-6 flex flex-col sm:flex-row gap-4">
              <input placeholder="Search tasks..." className="flex-1 border rounded-lg p-2" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="border rounded-lg p-2" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <select className="border rounded-lg p-2" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "COMPLETED";
                return (
                  <div key={task.id} className={`bg-white rounded-xl shadow p-6 border-l-4 ${isOverdue ? "border-red-500" : task.status === "COMPLETED" ? "border-green-500" : "border-indigo-500"}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <h3 className={`text-lg font-bold ${task.status === "COMPLETED" ? "line-through text-gray-400" : "text-gray-900"}`}>{task.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold mt-3">
                          <span className={`px-2 py-1 rounded ${task.priority === "HIGH" ? "bg-red-100 text-red-800" : task.priority === "MEDIUM" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}`}>
                            {task.priority}
                          </span>
                          {task.deadline && (
                            <span className={`px-2 py-1 rounded ${isOverdue ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                              {new Date(task.deadline).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                        <button
                          onClick={() => updateTaskStatus(task.id, task.status === "PENDING" ? "COMPLETED" : "PENDING")}
                          className={`px-3 py-1 rounded text-sm ${task.status === "PENDING" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                        >
                          {task.status === "PENDING" ? "Complete" : "Undo"}
                        </button>
                        {deleteConfirmId === task.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => deleteTask(task.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Confirm</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm hover:bg-gray-300">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(task.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100">Delete</button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {tasks.length === 0 && <div className="text-center text-gray-500 p-8">No tasks found.</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

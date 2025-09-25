const API_BASE_URL =  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api';

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  error?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'TEAM_MEMBER' | 'CLIENT' | 'FAST_CLIENT';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED';
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  projectId: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  taskId: string;
  assignedToId?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  taskId?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  socialMediaLinks?: any;
  status: 'PROSPECT' | 'ACTIVE' | 'IN_PROJECT' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  // Relaciones
  user?: UserResponse;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  total: number | string;
  invoiceId: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number | string;
  taxes: number | string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID';
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
  };
}

// Notification interfaces and types
export type NotificationType = 
  | 'NEW_TASK_ASSIGNED'
  | 'TASK_STATUS_UPDATED'
  | 'PROJECT_CREATED'
  | 'PROJECT_STATUS_UPDATED'
  | 'COMMENT_CREATED'
  | 'INVOICE_GENERATED'
  | 'PAYMENT_REMINDER';

export type EntityType = 'TASK' | 'PROJECT' | 'INVOICE' | 'COMMENT';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  content?: string | null;
  entityType: EntityType;
  entityId: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  message: string;
}

export interface SingleNotificationResponse {
  success: boolean;
  data: Notification;
  message: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    // Fallback: si no hay token en memoria, intentar recuperarlo de localStorage
    if (!this.token && typeof window !== 'undefined') {
      const stored = localStorage.getItem('accessToken');
      if (stored) {
        this.token = stored;
      }
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return undefined as T;
      }
      // Si el cuerpo está vacío, no intentar parsear JSON
      const text = await response.text();
      if (!text) {
        return undefined as T;
      }
      return JSON.parse(text);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.accessToken) {
      this.setToken(response.accessToken);
    }
    
    return response;
  }

  async register(fullName: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });
    
    if (response.accessToken) {
      this.setToken(response.accessToken);
    }
    
    return response;
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me');
  }

  // Users endpoints
  async getUsers(): Promise<UserResponse[]> {
    return this.request<UserResponse[]>('/users');
  }

  async getUserById(id: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${id}`);
  }

  async createUser(userData: {
    email: string;
    password: string;
    fullName: string;
    role?: 'ADMIN' | 'TEAM_MEMBER' | 'CLIENT' | 'FAST_CLIENT';
  }): Promise<UserResponse> {
    return this.request<UserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async createFastClient(userData: {
    name: string;
  }): Promise<UserResponse> {
    return this.request<UserResponse>('/users/fast-client', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: {
    fullName?: string;
    email?: string;
    password?: string;
  }): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Clients endpoints (según documentación API)
  async getClients(): Promise<ClientProfile[]> {
    return this.request<ClientProfile[]>('/clients');
  }

  async getClientById(id: string): Promise<ClientProfile> {
    return this.request<ClientProfile>(`/clients/${id}`);
  }

  async createClient(clientData: {
    userId: string;
    companyName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    socialMediaLinks?: any;
    status: 'PROSPECT' | 'ACTIVE' | 'IN_PROJECT' | 'COMPLETED' | 'ARCHIVED';
  }): Promise<ClientProfile> {
    return this.request<ClientProfile>('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async updateClient(id: string, clientData: Partial<{
    companyName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    socialMediaLinks?: any;
    status?: 'PROSPECT' | 'ACTIVE' | 'IN_PROJECT' | 'COMPLETED' | 'ARCHIVED';
  }>): Promise<ClientProfile> {
    return this.request<ClientProfile>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(clientData),
    });
  }

  async deleteClient(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // Projects endpoints
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProjectById(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(projectData: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED';
    clientId: string;
  }): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: Partial<{
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'ARCHIVED';
    clientId: string;
  }>): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks endpoints
  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks');
  }

  async getTaskById(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(taskData: {
    projectId: string;
    title: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    assignedToId?: string;
  }): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, taskData: Partial<{
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string;
    assignedToId: string;
    projectId: string;
  }>): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Subtasks endpoints
  async getSubtasks(): Promise<Subtask[]> {
    return this.request<Subtask[]>('/subtasks');
  }

  async getSubtaskById(id: string): Promise<Subtask> {
    return this.request<Subtask>(`/subtasks/${id}`);
  }

  async createSubtask(subtaskData: {
    taskId: string;
    title: string;
    description?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    assignedToId?: string;
  }): Promise<Subtask> {
    return this.request<Subtask>('/subtasks', {
      method: 'POST',
      body: JSON.stringify(subtaskData),
    });
  }

  async updateSubtask(id: string, subtaskData: Partial<{
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string;
    assignedToId: string;
    isCompleted: boolean;
    taskId: string;
  }>): Promise<Subtask> {
    return this.request<Subtask>(`/subtasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(subtaskData),
    });
  }

  async deleteSubtask(id: string): Promise<void> {
    return this.request<void>(`/subtasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Comments endpoints
  async getComments(): Promise<Comment[]> {
    return this.request<Comment[]>('/comments');
  }

  async getCommentById(id: string): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}`);
  }

  async createComment(commentData: {
    content: string;
    userId: string;
    taskId?: string;
    projectId?: string;
  }): Promise<Comment> {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async updateComment(id: string, commentData: {
    content?: string;
    taskId?: string;
    projectId?: string;
  }): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(commentData),
    });
  }

  async deleteComment(id: string): Promise<void> {
    return this.request<void>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // Client Profile endpoints
  async getClientProfileByUserId(userId: string): Promise<ClientProfile> {
    return this.request<ClientProfile>(`/clients/profile/by-user/${userId}`);
  }

  async completeClientProfile(userId: string, profileData: {
    companyName: string;
    contactPerson: string;
    phone?: string;
    address?: string;
  }): Promise<ClientProfile> {
    return this.request<ClientProfile>(`/clients/profile/by-user/${userId}`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }

  // Invoice endpoints
  async getInvoices(): Promise<Invoice[]> {
    return this.request<Invoice[]>('/invoices');
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async createInvoice(invoiceData: {
    clientId: string;
    projectId?: string;
    issueDate: string;
    dueDate: string;
    status: 'DRAFT' | 'SENT';
    taxes?: number | string;
    items: {
      description: string;
      quantity: number | string;
      unitPrice: number | string;
    }[];
    notes?: string;
  }): Promise<Invoice> {
    return this.request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  async updateInvoice(id: string, invoiceData: Partial<{
    clientId: string;
    projectId?: string;
    issueDate: string;
    dueDate: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'VOID';
    taxes: number | string;
    items: {
      id?: string;
      description: string;
      quantity: number | string;
      unitPrice: number | string;
    }[];
    notes?: string;
  }>): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(invoiceData),
    });
  }

  async deleteInvoice(id: string): Promise<void> {
    return this.request<void>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  }

  // Notifications methods
  async getNotifications(): Promise<Notification[]> {
    const response = await this.request<NotificationResponse>('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const response = await this.request<SingleNotificationResponse>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return response.data;
  }

  async getAllNotificationsForAdmin(): Promise<Notification[]> {
    const response = await this.request<NotificationResponse>('/notifications/admin/all');
    return response.data;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
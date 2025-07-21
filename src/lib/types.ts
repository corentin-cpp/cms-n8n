export type SettingValue = string | number | boolean | object | null;

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface CSVImport {
  id: string;
  user_id: string;
  name: string;
  filename: string;
  columns: string[];
  data: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description: string;
  n8n_workflow_id?: string;
  webhook_url?: string;
  webhook_method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  webhook_headers?: Record<string, string>;
  webhook_params?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationSetting {
  id: string;
  automation_id: string;
  setting_id: string;
  created_at: string;
}

export interface AutomationWithSettings extends Automation {
  automation_settings?: {
    setting_id: string;
    settings: {
      id: string;
      category: string;
      key: string;
      value: SettingValue;
      description?: string;
    };
  }[];
}

export interface AutomationExecution {
  id: string;
  automation_id: string;
  status: 'success' | 'error' | 'running';
  execution_data: Record<string, unknown>;
  error_message?: string;
  created_at: string;
}

export interface AutomationExecutionWithName extends AutomationExecution {
  automations: {
    name: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}
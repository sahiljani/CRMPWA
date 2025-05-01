// Base URL for the BorderIQ CRM API
const API_BASE_URL = 'https://crm.borderiq.org/api';

/**
 * Represents a lead in the BorderIQ CRM.
 */
export interface Lead {
  /**
   * The unique identifier of the lead.
   */
  id: string;
  /**
   * The hash of the lead.
   */
  hash?: string;
  /**
   * The name of the lead.
   */
  name: string;
  /**
   * The contact information of the lead.
   */
  contact?: string;
  /**
   * The title of the lead.
   */
  title?: string;
  /**
   * The company associated with the lead.
   */
  company?: string;
  /**
   * The description of the lead.
   */
  description?: string;
  /**
   * The country of the lead.
   */
  country?: string; // Assuming country ID is returned as string
  /**
   * The zip code of the lead.
   */
  zip?: string | null;
  /**
   * The city of the lead.
   */
  city?: string;
  /**
   * The state of the lead.
   */
  state?: string;
  /**
   * The address of the lead.
   */
  address?: string;
  /**
   * The user assigned to the lead.
   */
  assigned: string; // Assuming assigned user ID is returned as string
  /**
   * The date the lead was added. Format: "YYYY-MM-DD HH:MM:SS"
   */
  dateadded?: string;
  /**
   * The form ID the lead originated from.
   */
  from_form_id?: string;
  /**
   * The status of the lead.
   */
  status: string; // Assuming status ID is returned as string
  /**
   * The source of the lead.
   */
  source: string; // Assuming source ID is returned as string
  // Allow for other potential fields returned by the API
  email?: string;
  website?: string;
  phonenumber?: string;
  default_language?: string;
  lastcontact?: string;
  is_public?: string;
  tags?: string; // Assuming tags might be returned as a string
  [key: string]: any;
}


/**
 * Represents the data required to create a new lead.
 */
export interface CreateLeadData {
  source: string; // Mandatory
  status: string; // Mandatory
  name: string; // Mandatory
  assigned: string; // Mandatory
  client_id?: string; // Optional
  tags?: string; // Optional
  contact?: string; // Optional
  title?: string; // Optional
  email?: string; // Optional
  website?: string; // Optional
  phonenumber?: string; // Optional
  company?: string; // Optional
  address?: string; // Optional
  city?: string; // Optional
  zip?: string; // Optional
  state?: string; // Optional
  country?: string; // Optional
  default_language?: string; // Optional
  description?: string; // Optional
  custom_contact_date?: string; // Optional - Note: API docs mention this, but it's unusual for create
  contacted_today?: string; // Optional - Note: API docs mention this, but it's unusual for create
  is_public?: string; // Optional
}

/**
 * Represents the data required to update a lead.
 * Similar to CreateLeadData but might not require all mandatory fields
 * depending on API behavior (though docs say source, status, name, assigned are mandatory for update too).
 */
export interface UpdateLeadData {
  source: string; // Mandatory per docs
  status: string; // Mandatory per docs
  name: string; // Mandatory per docs
  assigned: string; // Mandatory per docs
  client_id?: string; // Optional
  tags?: string; // Optional
  contact?: string; // Optional
  title?: string; // Optional
  email?: string; // Optional
  website?: string; // Optional
  phonenumber?: string; // Optional
  company?: string; // Optional
  address?: string; // Optional
  city?: string; // Optional
  zip?: string; // Optional
  state?: string; // Optional
  country?: string; // Optional
  default_language?: string; // Optional
  description?: string; // Optional
  lastcontact?: string; // Optional - Specific to update
  is_public?: string; // Optional
}

// Helper function for making API requests
async function fetchCrmApi<T>(
  endpoint: string,
  authToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'authtoken': authToken,
    'Content-Type': 'application/json', // Assume JSON for POST/PUT
    'Accept': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        // If response is not JSON
        errorData = { message: `HTTP error! status: ${response.status}` };
    }
     // Use the message from the API error response if available
    throw new Error(errorData?.message || `API request failed with status ${response.status}`);
  }

   // Handle cases where API returns 200 OK but indicates failure in the body
  const data: any = await response.json();
  if (data.status === false) {
       throw new Error(data.message || 'API request failed.');
   }


  // For GET requests returning lead lists or single leads, the data might be directly the lead/leads array
  // For POST/PUT/DELETE returning status messages, we check the 'status' field
  // Adjust based on actual API response structure if needed
  return data as T;

}

/**
 * Asynchronously adds a new lead to the BorderIQ CRM.
 *
 * @param authToken The authentication token.
 * @param leadData The data for the new lead.
 * @returns A promise that resolves to the success message from the API.
 */
export async function addLead(authToken: string, leadData: CreateLeadData): Promise<{ status: boolean; message: string }> {
    console.log("Adding lead with data:", leadData);
    return fetchCrmApi<{ status: boolean; message: string }>(`/leads`, authToken, {
        method: 'POST',
        body: JSON.stringify(leadData),
    });
}

/**
 * Asynchronously retrieves lead information from the BorderIQ CRM.
 * The API docs suggest the response body directly contains the lead object upon success.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to retrieve.
 * @returns A promise that resolves to a Lead object or null if not found (API might return 404 handled by fetchCrmApi).
 */
export async function getLead(authToken: string, id: string): Promise<Lead> {
    console.log("Retrieving lead with ID:", id);
    // The API returns the lead object directly, not nested under a "Lead" key based on example.
    return fetchCrmApi<Lead>(`/leads/${id}`, authToken, { method: 'GET' });
}


/**
 * Asynchronously retrieves all leads from the BorderIQ CRM.
 * The API docs suggest the response body is an array of lead objects.
 *
 * @param authToken The authentication token.
 * @returns A promise that resolves to an array of Lead objects.
 */
export async function getAllLeads(authToken: string): Promise<Lead[]> {
    console.log("Retrieving all leads.");
    // The API returns an array of leads directly.
    return fetchCrmApi<Lead[]>(`/leads`, authToken, { method: 'GET' });
}


/**
 * Asynchronously searches for leads in the BorderIQ CRM.
 * The API docs suggest the response body is an array of matching lead objects.
 *
 * @param authToken The authentication token.
 * @param keysearch The search keywords.
 * @returns A promise that resolves to an array of Lead objects.
 */
export async function searchLeads(authToken: string, keysearch: string): Promise<Lead[]> {
    console.log("Searching leads with keyword:", keysearch);
     // Encode the search term to handle special characters in the URL
    const encodedKeysearch = encodeURIComponent(keysearch);
    // The API returns an array of leads directly.
    return fetchCrmApi<Lead[]>(`/leads/search/${encodedKeysearch}`, authToken, { method: 'GET' });
}


/**
 * Asynchronously updates a lead in the BorderIQ CRM.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to update.
 * @param leadData The data to update for the lead.
 * @returns A promise that resolves to the success message from the API.
 */
export async function updateLead(authToken: string, id: string, leadData: UpdateLeadData): Promise<{ status: boolean; message: string }> {
    console.log("Updating lead with ID:", id, "and data:", leadData);
    return fetchCrmApi<{ status: boolean; message: string }>(`/leads/${id}`, authToken, {
        method: 'PUT',
        body: JSON.stringify(leadData),
    });
}

/**
 * Asynchronously deletes a lead from the BorderIQ CRM.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to delete.
 * @returns A promise that resolves to the success message from the API.
 */
export async function deleteLead(authToken: string, id: string): Promise<{ status: boolean; message: string }> {
    console.log("Deleting lead with ID:", id);
    return fetchCrmApi<{ status: boolean; message: string }>(`/delete/leads/${id}`, authToken, {
        method: 'DELETE',
    });
}

// --- Helper Data for Forms (Example - Fetch or define actual sources/statuses) ---

// You should fetch these from your API or define them statically if they don't change often.
export const leadSources = [
    { id: '1', name: 'Website' },
    { id: '2', name: 'Referral' },
    { id: '3', name: 'Cold Call' },
    { id: '4', name: 'Advertisement' },
    { id: '5', name: 'Other' },
     // Add other sources based on your CRM setup
];

export const leadStatuses = [
    { id: '1', name: 'New' },
    { id: '2', name: 'Contacted' },
    { id: '3', name: 'Qualified' },
    { id: '4', name: 'Proposal Sent' },
    { id: '5', name: 'Negotiation' },
    { id: '6', name: 'Won' },
    { id: '7', name: 'Lost' },
     // Add other statuses based on your CRM setup
];

// Example: Fetch actual users/assignees from your system
export const assignees = [
    { id: '1', name: 'Admin User' },
    { id: '5', name: 'Sales Rep 1' },
    { id: '8', name: 'Sales Rep 2' },
    // Add other users
];

// Example: Fetch actual countries or use a standard list
export const countries = [
    { id: '243', name: 'United Kingdom' },
    { id: '236', name: 'United States' },
    { id: '38', name: 'Canada' },
     // Add more countries...
];

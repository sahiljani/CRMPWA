// Use relative path for the Next.js API proxy route
// This ensures requests go to our backend first, which then forwards to the CRM API.
const API_BASE_URL = '/api/crm'; // Changed from direct CRM URL

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
 * Simplified to only include essential fields for the current UI.
 */
export interface CreateLeadData {
  name: string; // Mandatory
  phonenumber?: string; // Optional
  // Default values will be set when calling the API
  source?: string; // Made optional, will default
  status?: string; // Made optional, will default
  assigned?: string; // Made optional, will default
  // Other optional fields from original interface if needed later
  // client_id?: string;
  // tags?: string;
  // contact?: string;
  // title?: string;
  // email?: string;
  // website?: string;
  // company?: string;
  // address?: string;
  // city?: string;
  // zip?: string;
  // state?: string;
  // country?: string;
  // default_language?: string;
  // description?: string;
  // custom_contact_date?: string;
  // contacted_today?: string;
  // is_public?: string;
}

/**
 * Represents the data required to update a lead.
 * Simplified for current UI needs.
 */
export interface UpdateLeadData {
  name: string; // Mandatory per docs, always included
  phonenumber?: string; // Optional field to update
  // Required by API for update, will be fetched and included
  source: string;
  status: string;
  assigned: string;
  // Other optional fields from original interface if needed later
  // client_id?: string;
  // tags?: string;
  // contact?: string;
  // title?: string;
  // email?: string;
  // website?: string;
  // company?: string;
  // address?: string;
  // city?: string;
  // zip?: string;
  // state?: string;
  // country?: string;
  // default_language?: string;
  // description?: string;
  // lastcontact?: string;
  // is_public?: string;
}

// Helper function for making API requests via the Next.js proxy
async function fetchCrmApi<T>(
  endpoint: string, // This will be the path *after* /api/crm/
  authToken: string,
  options: RequestInit = {}
): Promise<T> {
  // The full URL now points to our local proxy route
  const url = `${API_BASE_URL}${endpoint}`; // e.g., /api/crm/leads

  // Headers sent *to the proxy route*
  const headers = {
    'authtoken': authToken, // Send the token for the proxy to use
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: `API request failed! status: ${response.status}` };
    }
    // Throw error with message from proxy/API if available
    throw new Error(errorData?.message || `API request via proxy failed with status ${response.status}`);
  }

  // Handle cases where API (via proxy) returns 200 OK but indicates failure in the body
   const responseText = await response.text(); // Read response as text first
   try {
     const data: any = JSON.parse(responseText); // Try parsing as JSON
     // Check for explicit failure status from the *actual* CRM API response structure
     if (data.status === false) {
       throw new Error(data.message || 'API operation failed.');
     }
     return data as T;
   } catch (e) {
        // If it's not JSON or doesn't have status, assume success if response.ok was true
        // Handle non-JSON success responses if necessary, or re-throw if parsing failed unexpectedly
        if (e instanceof SyntaxError && response.ok) {
             // If it was OK but not JSON, maybe return the text? Or handle as specific case.
             // For now, let's assume JSON is expected for success data.
             console.warn("Received non-JSON response for supposedly successful request:", responseText);
             // Return a generic success or handle based on content-type if needed
             return {} as T; // Or adjust based on expected non-JSON success
        }
        // Re-throw other errors (like the explicit status:false error)
        throw e;
   }
}

/**
 * Asynchronously adds a new lead to the BorderIQ CRM via the proxy.
 *
 * @param authToken The authentication token.
 * @param leadData The data for the new lead (only name and phonenumber needed from UI).
 * @returns A promise that resolves to the success message from the API.
 */
export async function addLead(authToken: string, leadData: CreateLeadData): Promise<{ status: boolean; message: string; id?: string }> {
    console.log("Adding lead via proxy with data:", leadData);
    // Add default required fields before sending
    const fullLeadData: any = {
        ...leadData,
        source: leadData.source || '5', // Default 'Other'
        status: leadData.status || '1', // Default 'New'
        assigned: leadData.assigned || '1', // Default 'Admin User'
    };
    // The endpoint path should NOT start with a slash here as API_BASE_URL doesn't have a trailing one
    return fetchCrmApi<{ status: boolean; message: string; id?: string }>(`/leads`, authToken, {
        method: 'POST',
        body: JSON.stringify(fullLeadData),
    });
}


/**
 * Asynchronously retrieves lead information via the proxy.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to retrieve.
 * @returns A promise that resolves to a Lead object.
 */
export async function getLead(authToken: string, id: string): Promise<Lead> {
    console.log("Retrieving lead via proxy with ID:", id);
    return fetchCrmApi<Lead>(`/leads/${id}`, authToken, { method: 'GET' });
}


/**
 * Asynchronously retrieves all leads via the proxy.
 * **Important:** The API endpoint used in the working curl command is `/leadsi/leads`.
 * Update the endpoint here to match.
 *
 * @param authToken The authentication token.
 * @returns A promise that resolves to an array of Lead objects.
 */
export async function getAllLeads(authToken: string): Promise<Lead[]> {
    console.log("Retrieving all leads via proxy.");
    // Corrected endpoint based on working curl command
    return fetchCrmApi<Lead[]>(`/leadsi/leads`, authToken, { method: 'GET' });
}


/**
 * Asynchronously searches for leads via the proxy.
 *
 * @param authToken The authentication token.
 * @param keysearch The search keywords.
 * @returns A promise that resolves to an array of Lead objects.
 */
export async function searchLeads(authToken: string, keysearch: string): Promise<Lead[]> {
    console.log("Searching leads via proxy with keyword:", keysearch);
    const encodedKeysearch = encodeURIComponent(keysearch);
    // Assuming the search endpoint follows the pattern, adjust if needed
    return fetchCrmApi<Lead[]>(`/leads/search/${encodedKeysearch}`, authToken, { method: 'GET' });
}


/**
 * Asynchronously updates a lead via the proxy.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to update.
 * @param leadData The data to update for the lead.
 * @returns A promise that resolves to the success message from the API.
 */
export async function updateLead(authToken: string, id: string, leadData: UpdateLeadData): Promise<{ status: boolean; message: string }> {
    console.log("Updating lead via proxy with ID:", id, "and data:", leadData);
     // Ensure all mandatory fields for update are included
    const fullUpdateData: UpdateLeadData = {
        name: leadData.name,
        phonenumber: leadData.phonenumber,
        source: leadData.source, // Already included in the type definition
        status: leadData.status, // Already included in the type definition
        assigned: leadData.assigned, // Already included in the type definition
        // Include other optional fields if they exist in leadData
        // ... (spread other potential fields from leadData if necessary)
    };
    return fetchCrmApi<{ status: boolean; message: string }>(`/leads/${id}`, authToken, {
        method: 'PUT',
        body: JSON.stringify(fullUpdateData), // Send the complete required data
    });
}

/**
 * Asynchronously deletes a lead via the proxy.
 *
 * @param authToken The authentication token.
 * @param id The unique identifier of the lead to delete.
 * @returns A promise that resolves to the success message from the API.
 */
export async function deleteLead(authToken: string, id: string): Promise<{ status: boolean; message: string }> {
    console.log("Deleting lead via proxy with ID:", id);
    return fetchCrmApi<{ status: boolean; message: string }>(`/delete/leads/${id}`, authToken, {
        method: 'DELETE',
    });
}

// --- Helper Data (Keep as is) ---

export const leadStatuses = [
    { id: '1', name: 'New' },
    { id: '2', name: 'Contacted' },
    { id: '3', name: 'Qualified' },
    { id: '4', name: 'Proposal Sent' },
    { id: '5', name: 'Negotiation' },
    { id: '6', name: 'Won' },
    { id: '7', name: 'Lost' },
];

// Default values used in addLead if not provided
export const defaultSourceId = '5'; // 'Other'
export const defaultStatusId = '1'; // 'New'
export const defaultAssigneeId = '1'; // 'Admin User'

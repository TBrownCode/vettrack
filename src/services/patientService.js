// Mock data service for development
const mockPatients = [
    { 
      id: 'PT001', 
      name: 'Max', 
      species: 'Dog',
      breed: 'Golden Retriever',
      owner: 'Sarah Johnson',
      phone: '555-123-4567',
      status: 'Admitted',
      lastUpdate: new Date().toLocaleTimeString(),
      photoUrl: '/images/placeholder-dog.jpg'
    },
    { 
      id: 'PT002', 
      name: 'Luna', 
      species: 'Cat',
      breed: 'Siamese',
      owner: 'Michael Chen',
      phone: '555-987-6543',
      status: 'In Surgery',
      lastUpdate: new Date(Date.now() - 20 * 60000).toLocaleTimeString(),
      photoUrl: '/images/placeholder-cat.jpg'
    },
    { 
      id: 'PT003', 
      name: 'Bella', 
      species: 'Dog',
      breed: 'Poodle',
      owner: 'Jessica White',
      phone: '555-456-7890',
      status: 'In Recovery',
      lastUpdate: new Date(Date.now() - 5 * 60000).toLocaleTimeString(),
      photoUrl: '/images/placeholder-dog.jpg'
    }
  ];
  
  // Get all patients
  export const getPatients = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [...mockPatients];
  };
  
  // Get patient by ID
  export const getPatientById = async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const patient = mockPatients.find(p => p.id === id);
    
    if (!patient) {
      throw new Error(`Patient with ID ${id} not found`);
    }
    
    return {...patient};
  };
  
  // Add more service functions as needed
  // Add this function to your existing patientService.js file:

// Update patient status
export const updatePatientStatus = async (id, newStatus) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const patientIndex = mockPatients.findIndex(p => p.id === id);
  
  if (patientIndex === -1) {
    throw new Error(`Patient with ID ${id} not found`);
  }
  
  mockPatients[patientIndex] = {
    ...mockPatients[patientIndex],
    status: newStatus,
    lastUpdate: new Date().toLocaleTimeString()
  };
  
  return mockPatients[patientIndex];
};

// Update patient photo
export const updatePatientPhoto = async (id, photoData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const patientIndex = mockPatients.findIndex(p => p.id === id);
  
  if (patientIndex === -1) {
    throw new Error(`Patient with ID ${id} not found`);
  }
  
  // In a real app, this would upload the photo to a server
  // For now, we'll just update the photoUrl to the data URL
  mockPatients[patientIndex] = {
    ...mockPatients[patientIndex],
    photoUrl: photoData,
    lastUpdate: new Date().toLocaleTimeString()
  };
  
  return mockPatients[patientIndex];
};

// Add new patient
export const addPatient = async (patientData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real app, this would send the data to a backend
  // For now, just add to our mock data
  const newPatient = {
    ...patientData,
    lastUpdate: new Date().toLocaleTimeString()
  };
  
  mockPatients.unshift(newPatient); // Add to beginning of array
  
  return newPatient;
};

// Delete patient
export const deletePatient = async (id) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Find the patient index
  const patientIndex = mockPatients.findIndex(p => p.id === id);
  
  if (patientIndex === -1) {
    throw new Error(`Patient with ID ${id} not found`);
  }
  
  // Remove the patient from the array
  mockPatients.splice(patientIndex, 1);
  
  return { success: true, message: 'Patient deleted successfully' };
};
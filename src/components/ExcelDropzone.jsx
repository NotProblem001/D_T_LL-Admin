import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

const ExcelDropzone = () => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
  const [message, setMessage] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus('uploading');
    
    try {
      const response = await axios.post('http://localhost:8080/api/v1/importacion/excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadStatus('success');
      setMessage(response.data.message || 'Archivo procesado exitosamente.');
    } catch (error) {
      setUploadStatus('error');
      setMessage(error.response?.data?.error || 'Error de conexión o validación al procesar el archivo.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto mt-10">
      <div 
        {...getRootProps()} 
        className={`w-3/4 h-64 border-dashed border-4 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer transition-colors duration-300
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-300'}
          ${uploadStatus === 'uploading' ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadStatus === 'uploading' ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-xl text-gray-600 font-medium">Procesando archivo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <UploadCloud className="w-16 h-16 text-blue-500 mb-4" />
            <p className="text-xl text-gray-700 font-medium">
              {isDragActive 
                ? "Suelte el archivo aquí..." 
                : "Importación de Operaciones"}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Arrastre el archivo .xlsx aquí o haga clic para seleccionarlo
            </p>
          </div>
        )}
      </div>

      {uploadStatus === 'success' && (
        <div className="mt-8 w-3/4 bg-green-100 border-l-4 border-green-500 p-4 rounded-md shadow-sm flex items-start">
          <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-green-800">Éxito</h3>
            <p className="text-green-700 mt-1">{message}</p>
          </div>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="mt-8 w-3/4 bg-red-100 border-l-4 border-red-500 p-4 rounded-md shadow-sm flex items-start">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-red-800">Error en la Validación</h3>
            <p className="text-red-700 mt-1">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelDropzone;

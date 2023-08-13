import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import axios from 'axios'; // Import the axios library
import  './App.css'
import { Button, Typography, Table, TableHead, TableBody, TableRow, TableCell, Container, Grid } from '@material-ui/core';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();


function App() {
  const [recognizedText, setRecognizedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [capturedText, setCapturedText] = useState('');
  const [csvData, setCSVData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');


  const fetchAddressFromGoogleMapsAPI = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`
        // `https://maps.googleapis.com/maps/api/geocode/json?latlng=,&key=AIzaSyCl9Slu7Z3iLzhOIG6XnkWIhqBnM4aPvKg`
      );

      if (response.data) {
        const formattedAddress = response.data.display_name;
        setLocationAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  useEffect(() => {
    const savedCSVData = localStorage.getItem('csvData');
    if (savedCSVData) {
      setCSVData(Papa.parse(savedCSVData).data);
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = handleSpeechRecognition;
  }, []);

  useEffect(() => {
    const csvString = Papa.unparse(csvData);
    localStorage.setItem('csvData', csvString);
  }, [csvData]);

  const handleSpeechRecognition = (event) => {
    let interimText = '';
    let finalText = event.results[event.results.length -1][0].transcript
    // for (let i = 0; i < event.results.length; i++) {
    //   const transcript = event.results[i][0].transcript;
    //   if (event.results[i].isFinal) {
    //     finalText += transcript + ' ';
    //   } else {
    //     interimText += transcript + ' ';
    //   }
    // }

    setRecognizedText(finalText);
    if (isRecording) {
      setCapturedText(prevCapturedText => prevCapturedText + interimText);
    }
  };

  const startRecording = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        fetchAddressFromGoogleMapsAPI(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      { enableHighAccuracy: true }
    );
    setIsRecording(true);
    setCapturedText('');
    setRecognizedText('');
    recognition.start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    recognition.stop();

    if (recognizedText) {
      const geolocationLink = generateGoogleMapsUrl(); 
      const newRecord = [recognizedText.trim(), new Date().toLocaleString(), geolocationLink, locationAddress];
      setCSVData(prevCSVData => [...prevCSVData, newRecord]);
      setCapturedText('');
      setCurrentLocation(null);
    }
  };

  

  const generateGoogleMapsUrl = () => {
    if (currentLocation) {
      const { lat, lng } = currentLocation;
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    return '';
  };

  const downloadCSV = () => {
    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recorded_data.csv';
    link.click();
  };

  const clearAllData = () => {
    setIsRecording(false);
    setCapturedText('');
    setRecognizedText('');
    setCSVData([]);
    setCurrentLocation(null);
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" align="center" gutterBottom>
        Balakrishna Real Estate
      </Typography>
      <Button
        className={`mic-button ${isRecording ? 'recording' : ''}`}
        variant="contained"
        color="primary"
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      <Typography variant="h6" className="recording-status" align="center">
        {isRecording ? 'Recording...' : ''}
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <div className="recognized-text">
            <Typography variant="h4">Recognized Text:</Typography>
            <Typography variant="body1">{recognizedText}</Typography>
          </div>
        </Grid>
        <Grid item xs={12} md={6}>
          <div className="csv-data">
            <Typography variant="h4">CSV Data</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Text</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {csvData.map((record, index) => (
                  <TableRow key={index}>
                    {record.map((field, fieldIndex) => (
                      <TableCell key={fieldIndex}>
                        {fieldIndex === 2 && field ? (
                          <a href={field} target="_blank" rel="noopener noreferrer">
                            View on Map
                          </a>
                        ) : (
                          field
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button variant="outlined" color="secondary" onClick={clearAllData}>
              Clear Data
            </Button>
            <Button variant="contained" color="primary" onClick={downloadCSV} disabled={csvData.length === 0}>
              Download CSV
            </Button>
          </div>
        </Grid>
      </Grid>
    </Container>
  
  );
}

export default App;

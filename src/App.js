import './App.css';
import React, {Fragment} from 'react';

import crusive1 from './test_image/Cao/0.jpg'
import crusive2 from './test_image/Cao/1.jpg'
import crusive3 from './test_image/Cao/2.jpg'
import crusive4 from './test_image/Cao/7.jpg'
import crusive5 from './test_image/Cao/4.jpg'

import Standard1 from "./test_image/Kai/0.jpg"
import Standard2 from "./test_image/Kai/1.jpg"
import Standard3 from "./test_image/Kai/2.jpg"
import Standard4 from "./test_image/Kai/7.jpg"
import Standard5 from "./test_image/Kai/4.jpg"

import Clerical1 from "./test_image/Li/0.jpg"
import Clerical2 from "./test_image/Li/1.jpg"
import Clerical3 from "./test_image/Li/3.jpg"
import Clerical4 from "./test_image/Li/7.jpg"
import Clerical5 from "./test_image/Li/4.jpg"

import Seal1 from "./test_image/Zhuan/0.jpg"
import Seal2 from "./test_image/Zhuan/1.jpg"
import Seal3 from "./test_image/Zhuan/2.jpg"
import Seal4 from "./test_image/Zhuan/7.jpg"
import Seal5 from "./test_image/Zhuan/3.jpg"

// global variables to change where necessary
const DROPDOWN_API_ENDPOINT = 'https://ag72i68dq5.execute-api.us-east-1.amazonaws.com/prod'; // TODO The demo files GET/POST REST API
const ML_API_ENDPOINT = 'https://zhc7viossk.execute-api.us-east-1.amazonaws.com/prod'; // TODO The handwritten digit inference POST REST API 


// atob is deprecated but this function converts base64string to text string
const decodeFileBase64 = (base64String) => {
  // From Bytestream to Percent-encoding to Original string
  return decodeURIComponent(
    atob(base64String).split("").map(function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join("")
  );
};


function App() {
  const [inputFileData, setInputFileData] = React.useState(''); // represented as bytes data (string)
  const [outputFileData, setOutputFileData] = React.useState(''); // represented as readable data (text string)
  const [buttonDisable, setButtonDisable] = React.useState(true);
  const [buttonText, setButtonText] = React.useState('Submit');

  const [inputImage, setInputImage] = React.useState(''); // represented as bytes data (string)
  const [submitButtonText, setSubmitButtonText] = React.useState('Submit');
  const [fileButtonText, setFileButtonText] = React.useState('Upload File');
  const [demoDropdownFiles, setDemoDropdownFiles] = React.useState([]);
  const [selectedDropdownFile, setSelectedDropdownFile] = React.useState('');

  // make GET request to get demo files on load -- takes a second to load
  React.useEffect(() => {
    fetch(DROPDOWN_API_ENDPOINT)
    .then(response => response.json())
    .then(data => {
      // GET request error
      if (data.statusCode === 400) {
        console.log('Sorry! There was an error, the demo files are currently unavailable.')
      }

      // GET request success
      else {
        const s3BucketFiles = JSON.parse(data.body);
        setDemoDropdownFiles(s3BucketFiles["s3Files"]);
      }
    });
  }, [])

  // convert file to bytes data
  const convertFileToBytes = (inputFile) => {
    console.log('converting file to bytes...');
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(inputFile); // reads file as bytes data

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }

  // handle file input
  const handleChange = async (event) => {
    // Clear output text.
    setOutputFileData("");

    console.log('newly uploaded file');
    const inputFile = event.target.files[0];
    console.log(inputFile);

    setFileButtonText(inputFile.name);

    // convert file to bytes data
    const base64Data = await convertFileToBytes(inputFile);
    setInputImage(base64Data);
    const base64DataArray = base64Data.split('base64,'); // need to get rid of 'data:image/png;base64,' at the beginning of encoded string
    const encodedString = base64DataArray[1];
    setInputFileData(encodedString);
    console.log('file converted successfully');

    // enable submit button
    setButtonDisable(false);

    // reset demo dropdown selection
    setSelectedDropdownFile('');
  }

  // handle file submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // temporarily disable submit button
    setButtonDisable(true);
    setButtonText('Loading Result');

    // make POST request
    console.log('making POST request...');
    fetch(ML_API_ENDPOINT, {
      method: 'POST',
      headers: { "Content-Type": "application/json", "Accept": "text/plain" },
      body: JSON.stringify({ "image": inputFileData })
    }).then(response => response.json())
    .then(data => {
      console.log('getting response...')
      console.log(data);

      // POST request error
      if (data.statusCode === 400) {
        const outputErrorMessage = JSON.parse(data.errorMessage)['outputResultsData'];
        setOutputFileData(outputErrorMessage);
      }

      // POST request success
      else {
        const outputBytesData = JSON.parse(data.body)['outputResultsData'];
        setOutputFileData(decodeFileBase64(outputBytesData));
      }

      // re-enable submit button
      setButtonDisable(false);
      setButtonText('Submit');
    })
    .then(() => {
      console.log('POST request success');
    })
  }

  // handle demo dropdown file selection
  const handleDropdown = (event) => {
    setSelectedDropdownFile(event.target.value);

    // temporarily disable submit button
    setButtonDisable(true);
    setSubmitButtonText('Loading Demo File...');

    // only make POST request on file selection
    if (event.target.value) {
      fetch(DROPDOWN_API_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ "fileName": event.target.value })
      }).then(response => response.json())
      .then(data => {

        // POST request error
        if (data.statusCode === 400) {
          console.log('Uh oh! There was an error retrieving the dropdown file from the S3 bucket.')
        }

        // POST request success
        else {
          const dropdownFileBytesData = JSON.parse(data.body)['bytesData'];
          setInputFileData(dropdownFileBytesData);
          setInputImage('data:image/png;base64,' + dropdownFileBytesData); // hacky way of setting image from bytes data - even works on .jpeg lol
          setSubmitButtonText('Submit');
          setButtonDisable(false);
        }
      });
    }

    else {
      setInputFileData('');
    }
  }

  // return (
  //   <div className="App">
  //     <div className="Input">
  //       <h1>Input the calligraphy image to classify the style</h1>
  //       <form onSubmit={handleSubmit}>  
  //         <input type="file" accept=".png, .jpg, .jpeg" onChange={handleChange} />
  //         <button type="submit" disabled={buttonDisable}>{buttonText}</button>
  //       </form>
  //     </div>

  //     <div className="Output">
  //       <h1>Recognized as style:</h1>
  //       <p>{outputFileData}</p>
  //     </div>
      
  //   </div>
  // );
  return (
    <Fragment>
      <div className="App">
        
        <div className="Input">
          <h1>Input the calligraphy image to classify the style</h1>
          <p>upload the image by your own:</p>
          <form onSubmit={handleSubmit}>  
              <input type="file" accept=".png, .jpg, .jpeg" onChange={handleChange} />  
              <button type="submit" disabled={buttonDisable}>{buttonText}</button>
          </form>

          <p>OR upload from sample images:</p>
          <label htmlFor="demo-dropdown">Demo: </label>
          <select name="Select Image" id="demo-dropdown" value={selectedDropdownFile} onChange={handleDropdown}>
              <option value="">-- Select Demo File --</option>
              {demoDropdownFiles.map((file) => <option key={file} value={file}>{file}</option>)}
          </select>


        </div>



        {/* <div className="Input">
          <p>OR upload from sample images:</p>
          <form onSubmit={handleSubmit}>
            <select name="Sample scripts" id="samples">
              <option value={crusive1}>Select a sample script (Cursive as default)</option>
              <option value={crusive1}>Crusive scrip 1</option>
              <option value={crusive2}>Crusive scrip 2</option>
              <option value={crusive3}>Crusive scrip 3</option>
              <option value={crusive4}>Crusive scrip 4</option>
              <option value={crusive5}>Crusive scrip 5</option>

              <option value={Standard1}>Standard scrip 1</option>
              <option value={Standard2}>Standard scrip 2</option>
              <option value={Standard3}>Standard scrip 3</option>
              <option value={Standard4}>Standard scrip 4</option>
              <option value={Standard5}>Standard scrip 5</option>

              <option value={Clerical1}>Clerical scrip 1</option>
              <option value={Clerical2}>Clerical scrip 2</option>
              <option value={Clerical3}>Clerical scrip 3</option>
              <option value={Clerical4}>Clerical scrip 4</option>
              <option value={Clerical5}>Clerical scrip 5</option>

              <option value={Seal1}>Seal scrip 1</option>
              <option value={Seal2}>Seal scrip 2</option>
              <option value={Seal3}>Seal scrip 3</option>
              <option value={Seal4}>Seal scrip 4</option>
              <option value={Seal5}>Seal scrip 5</option>
            </select>
            <input type="submit" value="Submit" />  
          </form>
        </div> */}

        <div className="Output">
            <h1>Recognized as style:</h1>
            <p>{outputFileData}</p>
        </div>

        <h2>Cursive Script Samples:</h2>
          <p>script 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 5 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </p>
          <table><tr>
              <td><img src={crusive1} alt="Cursive Script" width="250" height="300"/></td>
              <td><img src={crusive2} alt="Cursive Script" width="250" height="300"/></td>
              <td><img src={crusive3} alt="Cursive Script" width="250" height="300"/></td>
              <td><img src={crusive4} alt="Cursive Script" width="250" height="300"/></td>
              <td><img src={crusive5} alt="Cursive Script" width="250" height="300"/></td>
          </tr></table>



          <h2>Standard Script Samples:</h2>
          <p>script 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 5 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </p>
          <table><tr>
              <td><img src={Standard1} alt="Standard Script" width="250" height="300"/></td>
              <td><img src={Standard2} alt="Standard Script" width="250" height="300"/></td>
              <td><img src={Standard3} alt="Standard Script" width="250" height="300"/></td>
              <td><img src={Standard4} alt="Standard Script" width="250" height="300"/></td>
              <td><img src={Standard5} alt="Standard Script" width="250" height="300"/></td>
          </tr></table>

          <h2>Clerical Script Samples:</h2>
          <p>script 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 5 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </p>
          <table><tr>
              <td><img src={Clerical1} alt="Clerical Script" width="250" height="300"/></td>
              <td><img src={Clerical2} alt="Clerical Script" width="250" height="300"/></td>
              <td><img src={Clerical3} alt="Clerical Script" width="250" height="300"/></td>
              <td><img src={Clerical4} alt="Clerical Script" width="250" height="300"/></td>
              <td><img src={Clerical5} alt="Clerical Script" width="250" height="300"/></td>
          </tr></table>

          <h2>Seal Script Samples:</h2>
          <p>script 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              script 5 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          </p>
          <table><tr>
              <td><img src={Seal1} alt="Seal Script" width="250" height="300"/></td>
              <td><img src={Seal2} alt="Seal Script" width="250" height="300"/></td>
              <td><img src={Seal3} alt="Seal Script" width="250" height="300"/></td>
              <td><img src={Seal4} alt="Seal Script" width="250" height="300"/></td>
              <td><img src={Seal5} alt="Seal Script" width="250" height="300"/></td>
          </tr></table>
        
      </div>
    </Fragment>

  );
}

export default App;
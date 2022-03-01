import React, {Component} from 'react';
import Particle from './components/particles/Particle'; 
import Clarifai from 'clarifai';
import Navigation from './components/navigations/Navigation';
import Logo from './components/logos/Logo';
import Rank from './components/ranks/Rank';
import SignIn from './components/signin/SignIn';
import Register from './components/register/Register';
import ImageLinkForm from './components/imagelinkforms/ImageLinkForm';
import FaceRecognition from './components/facerecognition/FaceRecognition';
import './App.css';
import 'tachyons';

const app = new Clarifai.App({
  apiKey: 'efe2b38ae3c44bea8097ebcc0f0186b6'
});

class App extends Component {

  constructor() {
    super();
    this.state = {
      input: '',
      imageURL: '',
      box: {},
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
         name: '',
        email: '',
        entries: 0,
        joined: ''
      }
    }
  }

  loadUser = (data) =>{
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }
  calculateFaceLocation = (data) => {
     const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
     const image = document.getElementById('inputImage');
     const width = Number(image.width);
     const height = Number(image.height);
     return {
       leftCol: clarifaiFace.left_col * width,
       topRow: clarifaiFace.top_row * height,
       rightCol: width - (clarifaiFace.right_col * width),
       bottomRow: height - (clarifaiFace.bottom_row * height)
     }
  }

  displayFaceBox = (box) =>{
    this.setState({box: box});
  }

  onInputChange = (event) =>{
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () =>{
    this.setState({imageURL: this.state.input});
    app.models
    .predict(
      Clarifai.FACE_DETECT_MODEL, 
      this.state.input)
      .then(response => {
        if(response){
          fetch('http://localhost:3000/image', {
              method: 'put',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
              id: this.state.user.id
              })
          })
          .then(response => response.json())
          .then(count => {
            this.setState(Object.assign(this.state.user,{entries: count}))
          })
        }
        this.displayFaceBox(this.calculateFaceLocation(response))
      })
      .catch(err => console.log(err));
  }
  
  onRouteChange = (route) => {
    if (route === 'signout') {
      this.setState({isSignedIn: false})
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }

  render(){
   const {isSignedIn, imageURL, route, box} = this.state;
    return (
      <div className="App">
        <Particle />
        <Navigation isSignedIn={isSignedIn} onRouteChange = {this.onRouteChange} />
        { route === 'home'
          ?<div> 
            <Logo />
            <Rank name={this.state.user.name} entries={this.state.user.entries}/>
            <ImageLinkForm 
              onInputChange={this.onInputChange} 
              onButtonSubmit={this.onButtonSubmit}
            />
            <FaceRecognition box={box} imageURL={imageURL}/>
            </div>
          :(
              route === 'signin'
              ? <SignIn loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
              : <Register loadUser={this.loadUser} onRouteChange={this.onRouteChange} />
          )
          
        }
      </div>
    );
  }
}

export default App;

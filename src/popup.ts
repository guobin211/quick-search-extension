import Popup from './components/popup.svelte'
import './popup.css';

const app = new Popup({
  target: document.getElementById('app'),
})

export default app

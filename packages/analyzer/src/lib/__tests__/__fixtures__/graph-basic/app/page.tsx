import Button from './components/Button';
import ServerMessage from './components/ServerMessage';

export default function HomePage() {
  Button({ label: 'Click' });
  ServerMessage();
  return 'home-page';
}

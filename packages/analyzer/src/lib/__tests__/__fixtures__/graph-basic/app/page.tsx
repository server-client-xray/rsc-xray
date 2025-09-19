import Button from './components/Button';
import ServerMessage from './components/ServerMessage';

export default function HomePage() {
  return (
    <main>
      <h1>Home</h1>
      <Button label="Click" />
      <ServerMessage />
    </main>
  );
}

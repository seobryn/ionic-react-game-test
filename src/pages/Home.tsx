import { IonContent, IonPage } from '@ionic/react';
import GameBoard from '../components/GameBoard';
import './Home.css';

const Home: React.FC = () => {

  return (
    <IonPage>
      <IonContent fullscreen scrollY={false}>
        <GameBoard />
      </IonContent>
    </IonPage>
  );
};

export default Home;

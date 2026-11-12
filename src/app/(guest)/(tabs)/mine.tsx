import { router } from 'expo-router';
import { View } from 'react-native';

import { GuestHeader } from '@/components/guest/guest-header';
import { PhotoGrid } from '@/components/guest/photo-grid';
import { usePhotoFeed } from '@/lib/use-photo-feed';

/** Mes photos : celles que j'ai partagées, à enregistrer sur mon téléphone. */
export default function MinePhotosScreen() {
  const feed = usePhotoFeed({ mine: true });
  return (
    <View style={{ flex: 1 }}>
      <GuestHeader title="Mes photos" />
      <PhotoGrid
        feed={feed}
        empty={{
          title: 'Aucune photo pour l’instant',
          message: 'Les photos que vous partagez arrivent ici. Touchez-en une pour l’enregistrer sur votre téléphone.',
          actionLabel: 'Partager une photo',
          onAction: () => router.navigate('/share'),
        }}
      />
    </View>
  );
}

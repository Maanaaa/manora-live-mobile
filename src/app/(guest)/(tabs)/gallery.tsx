import { router } from 'expo-router';
import { View } from 'react-native';

import { GuestHeader } from '@/components/guest/guest-header';
import { PhotoGrid } from '@/components/guest/photo-grid';
import { usePhotoFeed } from '@/lib/use-photo-feed';

/** Galerie en direct : toutes les photos de l'événement, mises à jour en temps réel. */
export default function GalleryScreen() {
  const feed = usePhotoFeed();
  return (
    <View style={{ flex: 1 }}>
      <GuestHeader title="Galerie en direct" />
      <PhotoGrid
        feed={feed}
        empty={{
          title: 'Pas encore de photo',
          message: 'Les photos de la borne et des invités apparaîtront ici, en direct.',
          actionLabel: 'Partager la première',
          onAction: () => router.navigate('/share'),
        }}
      />
    </View>
  );
}

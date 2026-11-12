import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/button';
import { isApiConfigured, type Photo } from '@/lib/api';
import { colors, fonts, radius } from '@/lib/theme';
import type { usePhotoFeed } from '@/lib/use-photo-feed';

import { StateView } from './state-view';

const COLUMNS = 3;
const GAP = 6;
const PADDING = 16;

type Props = {
  feed: ReturnType<typeof usePhotoFeed>;
  empty: { title: string; message: string; actionLabel?: string; onAction?: () => void };
};

function describe(photo: Photo) {
  const who = photo.source === 'booth' ? 'Photo de la borne' : `Photo de ${photo.authorName ?? 'un invité'}`;
  return `${who}${photo.mine ? ', la vôtre' : ''}. Ouvrir la photo.`;
}

/** Grille de photos commune à la galerie et à « Mes photos », avec tous ses états. */
export function PhotoGrid({ feed, empty }: Props) {
  const { width } = useWindowDimensions();
  const size = Math.floor((Math.min(width, 720) - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  if (!isApiConfigured) {
    return (
      <StateView
        icon="cloud"
        title="Galerie indisponible"
        message="Le serveur Manora Live n’est pas encore configuré sur cette app. Les photos apparaîtront ici dès qu’il le sera."
      />
    );
  }

  if (feed.status === 'loading') return <StateView loading title="Chargement des photos…" />;

  if (feed.status === 'error') {
    const offline = feed.error?.offline;
    return (
      <StateView
        icon={offline ? 'offline' : 'warning'}
        title={offline ? 'Vous êtes hors ligne' : 'Impossible d’afficher les photos'}
        message={feed.error?.message}
        actionLabel="Réessayer"
        onAction={feed.retry}
      />
    );
  }

  return (
    <FlatList
      data={feed.photos}
      keyExtractor={(photo) => photo.id}
      numColumns={COLUMNS}
      style={styles.list}
      contentContainerStyle={[styles.content, feed.photos.length === 0 && styles.contentEmpty]}
      columnWrapperStyle={styles.row}
      refreshControl={
        <RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} tintColor={colors.terracotta} colors={[colors.terracotta]} />
      }
      onEndReached={feed.loadMore}
      onEndReachedThreshold={0.6}
      ListEmptyComponent={
        <StateView icon="gallery" title={empty.title} message={empty.message} actionLabel={empty.actionLabel} onAction={empty.onAction} />
      }
      ListFooterComponent={
        feed.loadingMore ? (
          <ActivityIndicator color={colors.terracotta} style={styles.footer} />
        ) : feed.moreFailed ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Les photos suivantes n’ont pas pu être chargées.</Text>
            <Button label="Réessayer" variant="secondary" onPress={feed.loadMore} />
          </View>
        ) : undefined
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/photo/[id]', params: { id: item.id } })}
          accessibilityRole="imagebutton"
          accessibilityLabel={describe(item)}
          style={({ pressed }) => [styles.tile, { width: size, height: size }, pressed && styles.pressed]}>
          <Image
            source={{ uri: item.thumbUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
            recyclingKey={item.id}
          />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: PADDING, paddingTop: 4, gap: GAP, width: '100%', maxWidth: 720, alignSelf: 'center' },
  contentEmpty: { flexGrow: 1 },
  row: { gap: GAP },
  tile: { overflow: 'hidden', borderRadius: radius.sm, backgroundColor: colors.sand },
  pressed: { opacity: 0.8 },
  footer: { paddingVertical: 20, gap: 12, alignItems: 'center' },
  footerText: { fontFamily: fonts.medium, fontSize: 15, color: colors.muted, textAlign: 'center' },
});

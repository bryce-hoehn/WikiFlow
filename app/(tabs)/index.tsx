import ForYouFeed from '@/components/home/ForYouFeed';
import HotFeed from '@/components/home/HotFeed';
import RandomFeed from '@/components/home/RandomFeed';
import React, { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SceneRendererProps, TabBar, TabView } from 'react-native-tab-view';

export default function HomeScreen() {
  const theme = useTheme();
  const layout = useWindowDimensions();
  
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'for-you', title: 'For You' },
    { key: 'hot', title: 'Hot' },
    { key: 'random', title: 'Random' },
  ]);

  const handleTabPress = (tabIndex: number) => {
    setIndex(tabIndex);
  };

  const renderScene = ({ route }: { route: { key: string } }) => {
    switch (route.key) {
      case 'for-you':
        return <ForYouFeed />;
      case 'hot':
        return <HotFeed />;
      case 'random':
        return <RandomFeed />;
      default:
        return null;
    }
  };

  const renderTabBar = (props: SceneRendererProps & { navigationState: any }) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: theme.colors.primary }}
      style={{ backgroundColor: theme.colors.surface, elevation: 0 }}
      tabStyle={{ 
        backgroundColor: theme.colors.surface,
        width: layout.width / 3, // Each tab takes 1/3 of screen width
      }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      scrollEnabled={false} // Disable scrolling since tabs fit screen
    />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }} edges={['top']}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleTabPress}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        style={{ backgroundColor: theme.colors.surface }}
      />
    </SafeAreaView>
  );
}

import { FlashList } from '@shopify/flash-list';
import { Image } from "expo-image";
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { Appbar, Card, Text, useTheme } from 'react-native-paper';

const rootCategories = {
  'Academic disciplines': require('../../assets/images/categories/Academic disciplines.jpg'),
  'Behavior': require('../../assets/images/categories/Behavior.jpg'),
  'Business': require('../../assets/images/categories/Business.jpg'),
  'Communication': require('../../assets/images/categories/Communication.jpg'),
  'Concepts': require('../../assets/images/categories/Concepts.png'),
  'Culture': require('../../assets/images/categories/Culture.jpg'),
  'Economy': require('../../assets/images/categories/Economy.jpg'),
  'Education': require('../../assets/images/categories/Education.jpg'),
  'Energy': require('../../assets/images/categories/Energy.jpg'),
  'Engineering': require('../../assets/images/categories/Engineering.jpg'),
  'Entities': require('../../assets/images/categories/Entities.png'),
  'Food and drink': require('../../assets/images/categories/Food and Drink.jpg'),
  'Geography': require('../../assets/images/categories/Geography.jpeg'),
  'Government': require('../../assets/images/categories/Government.jpg'),
  'Humanities': require('../../assets/images/categories/Humanities.jpg'),
  'Information': require('../../assets/images/categories/Information.jpg'),
  'Knowledge': require('../../assets/images/categories/Knowledge.jpg'),
  'Language': require('../../assets/images/categories/Language.jpg'),
  'Law': require('../../assets/images/categories/Law.jpg'),
  'Life': require('../../assets/images/categories/Life.jpg'),
  'Lists': require('../../assets/images/categories/Lists.png'),
  'Mass media': require('../../assets/images/categories/Mass media.jpg'),
  'Mathematics': require('../../assets/images/categories/Mathematics.png'),
  'Nature': require('../../assets/images/categories/Nature.jpg'),
  'People': require('../../assets/images/categories/People.jpg'),
  'Philosophy': require('../../assets/images/categories/Philosophy.jpg'),
  'Politics': require('../../assets/images/categories/Politics.jpg'),
  'Religion': require('../../assets/images/categories/Religion.png'),
  'Science': require('../../assets/images/categories/Science.png'),
  'Society': require('../../assets/images/categories/Society.jpg'),
  'Technology': require('../../assets/images/categories/Technology.jpg'),
  'Time': require('../../assets/images/categories/Time.jpg'),
  'Universe': require('../../assets/images/categories/Universe.jpg')
} as const;

export default function CategoriesScreen() {
  const theme = useTheme();

  const renderCategoryItem = ({ item }: { item: [string, any] }) => (
    <Card
      style={{
        flex: 1,
        margin: 8,
        borderRadius: 12,
        elevation: 1,
        overflow: 'hidden',
      }}
      onPress={() => router.push(`/subcategory/${encodeURIComponent(item[0])}`)}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${item[0]} category`}
      accessibilityHint={`Opens articles in the ${item[0]} category`}
    >
      <Image
        source={item[1]}
        style={{
          height: 96,
          width: '100%',
          borderRadius: 12,
        }}
        alt={`${item[0]} category image`}
        accessibilityLabel={`${item[0]} category`}
        accessibilityHint={`Image representing the ${item[0]} category`}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 12,
        }}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      >
        <Text
          variant="titleLarge"
          style={{
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 3,
            paddingHorizontal: 8,
          }}
          numberOfLines={2}
          accessibilityRole="text"
        >
          {item[0]}
        </Text>
      </View>
    </Card>
  );

  return (
    <>
      {/* App Bar */}
      <Appbar.Header
        style={{
          backgroundColor: theme.colors.surface,
        }}
        mode='center-aligned'
      >
        <Appbar.Content
          title="Categories"
          titleStyle={{
            fontWeight: '700',
            fontSize: 20,
            color: theme.colors.onSurface,
          }}
        />
      </Appbar.Header>

      <FlashList
        data={Object.entries(rootCategories)}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item[0]}
        numColumns={2}
        style={{ backgroundColor: theme.colors.background }}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingVertical: 8,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      />
    </>
  );
}

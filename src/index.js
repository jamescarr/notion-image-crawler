import { Client } from '@notionhq/client';

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = 'd90abfad24f54393b4684f7f1885dbff';

(async () => {
  let cursor = undefined;

  const { results, next_cursor } = await notion.databases.query({
    database_id: databaseId,
    start_cursor: cursor,
  });

  for (const idx in results) {
    const page = results[idx];

    const file_url = page.properties.Front.files[0]?.file?.url;
    console.log(file_url);
    console.log(page);
    await appendImageIfNotExists(page.id, file_url);

    process.exit();
  }
})();

async function getPageContent(pageId) {
  try {
    const pageContent = await notion.blocks.children.list({
      block_id: pageId,
    });

    return pageContent.results;
  } catch (error) {
    console.error('Error retrieving page content:', error);
  }
}
async function appendImageIfNotExists(pageId, imageUrl) {
  const existingContent = await getPageContent(pageId);

  const imageAlreadyExists = existingContent.some((block) => {
    if (block.type === 'image') {
      return block.image.external.url === imageUrl;
    }
    return false;
  });

  if (!imageAlreadyExists) {
    const contentBlocks = [
      {
        object: 'block',
        type: 'image',
        image: {
          type: 'external',
          external: {
            url: imageUrl,
          },
        },
      },
    ];
    console.log(contentBlocks);

    await appendContentToPage(pageId, contentBlocks);
  } else {
    console.log('Image is already present on the page.');
  }
}

async function appendContentToPage(pageId, contentBlocks) {
  try {
    await notion.blocks.children.append({
      block_id: pageId,
      children: contentBlocks,
    });

    console.log('Content appended to the page');
  } catch (error) {
    console.error('Error appending content to the page:', error);
  }
}

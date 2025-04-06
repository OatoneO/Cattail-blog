import path from "path";
import fs from "fs";
import matter from "gray-matter";

const rootDirectory = path.join(process.cwd(), "content", "blog");

export async function getBlogBySlug(slug) {
  const filePath = path.join(rootDirectory, `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });

  const { data, content } = matter(fileContent);

  return { metadata: { ...data, slug }, content };
}

export async function getBlogs() {
  const files = fs.readdirSync(rootDirectory);

  const posts = files
    .map((file) => getBlogMetadata(file))
    .sort((a, b) =>
      new Date(a.publishedAt ?? "") < new Date(b.publishedAt ?? "") ? 1 : -1
    );

  return posts;
}

export function getBlogMetadata(filepath) {
  const slug = filepath.replace(/\.mdx$/, "");
  const filePath = path.join(rootDirectory, filepath);
  const fileContent = fs.readFileSync(filePath, { encoding: "utf8" });
  const { data } = matter(fileContent);
  return { ...data, slug };
}

from neo4j import GraphDatabase
import json

class Neo4jImporter:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def import_css_knowledge_graph(self, json_file_path):
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        with self.driver.session() as session:
            # 创建约束
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (n:CSSConcept) REQUIRE n.id IS UNIQUE")

            # 导入节点
            for node in data['nodes']:
                query = """
                MERGE (n:CSSConcept {id: $id})
                SET n.type = $type,
                    n.title = $title,
                    n.url = $url,
                    n.summary = $summary,
                    n.category = $category,
                    n.popularity = $popularity
                """
                properties = {
                    'id': node['id'],
                    'type': node['type'],
                    'title': node['properties']['title'],
                    'url': node['properties']['url'],
                    'summary': node['properties']['summary'],
                    'category': node['properties'].get('category', ''),
                    'popularity': node['properties'].get('popularity', 0)
                }
                session.run(query, properties)

            # 导入元数据
            meta_query = """
            MERGE (m:Meta {source: $source})
            SET m.timestamp = $timestamp,
                m.total_nodes = $total_nodes
            """
            session.run(meta_query, data['meta'])

def main():
    # Neo4j连接信息
    uri = "bolt://localhost:7687"  # 默认Neo4j Bolt端口
    user = "neo4j"
    password = "your_password"  # 请替换为你的实际密码

    importer = Neo4jImporter(uri, user, password)
    try:
        importer.import_css_knowledge_graph('mdn-knowledge-graph/css_knowledge_graph.json')
        print("CSS知识图谱导入成功！")
    except Exception as e:
        print(f"导入过程中发生错误: {e}")
    finally:
        importer.close()

if __name__ == "__main__":
    main() 
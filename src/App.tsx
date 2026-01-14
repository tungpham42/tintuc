import React, { useEffect, useState } from "react";
import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  Button,
} from "antd";
import { ReadOutlined, LinkOutlined, ReloadOutlined } from "@ant-design/icons";
import axios from "axios";
import sanitizeHtml from "sanitize-html";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { RSS_CATEGORIES } from "./constants";

const { Header, Content, Sider, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Meta } = Card;

// Interface dữ liệu tin tức
interface FeedItem {
  title: string;
  pubDate: string;
  link: string;
  thumbnail: string;
  description: string;
}

const parseDescription = (htmlString: string) => {
  const imgRegex = /<img.*?src="(.*?)"/;
  const imgMatch = htmlString.match(imgRegex);
  // Fallback ảnh nếu không tìm thấy
  const image = imgMatch
    ? imgMatch[1]
    : "https://placehold.co/600x400?text=VnExpress";

  const cleanText = sanitizeHtml(htmlString, {
    allowedTags: [],
  })
    .replace(/&gt;/g, "")
    .replace(/>/g, "")
    .trim(); // Loại bỏ các ký tự rác >

  return { image, snippet: cleanText };
};

const App: React.FC = () => {
  const [selectedCategory, setSelectedCategory] =
    useState<string>("tin-moi-nhat");
  const [loading, setLoading] = useState<boolean>(false);
  const [news, setNews] = useState<FeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (categoryKey: string) => {
    setLoading(true);
    setError(null);

    const category = RSS_CATEGORIES.find((c) => c.key === categoryKey);
    if (!category) return;

    try {
      // SỬ DỤNG ALLORIGINS ĐỂ LẤY RAW XML (Thay vì rss2json)
      const PROXY_URL = `https://api.allorigins.win/raw?url=${encodeURIComponent(
        category.url
      )}`;

      const response = await axios.get(PROXY_URL);

      // Tự phân tích XML bằng DOMParser của trình duyệt
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response.data, "text/xml");

      const items = Array.from(xmlDoc.querySelectorAll("item")).map((item) => {
        // Lấy dữ liệu từ các thẻ XML
        const title = item.querySelector("title")?.textContent || "";
        const pubDate = item.querySelector("pubDate")?.textContent || "";
        const link = item.querySelector("link")?.textContent || "";
        // VnExpress để nội dung mô tả trong thẻ description (chứa cả HTML ảnh)
        const description =
          item.querySelector("description")?.textContent || "";

        // Tách ảnh luôn tại đây
        const { image, snippet } = parseDescription(description);

        return {
          title,
          pubDate,
          link,
          thumbnail: image,
          description: snippet,
        };
      });

      if (items.length > 0) {
        setNews(items);
      } else {
        setError("Không tìm thấy tin tức nào trong RSS này.");
      }
    } catch (err) {
      setError(
        "Không thể tải dữ liệu. Có thể do chặn truy cập từ trình duyệt."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          background: "#9f224e",
          padding: "0 20px",
        }}
      >
        <div
          className="logo"
          style={{
            color: "white",
            fontSize: "1.5rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <ReadOutlined /> VNEXPRESS READER
        </div>
      </Header>

      <Layout>
        <Sider
          width={250}
          breakpoint="lg"
          collapsedWidth="0"
          style={{ background: "#fff" }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedCategory]}
            style={{ height: "100%", borderRight: 0 }}
            items={RSS_CATEGORIES.map((cat) => ({
              key: cat.key,
              label: cat.label,
            }))}
            onClick={(e) => {
              setSelectedCategory(e.key);
              window.scrollTo(0, 0);
            }}
          />
        </Sider>

        <Layout style={{ padding: "0 24px 24px" }}>
          <div
            style={{
              margin: "16px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <Title level={2} style={{ margin: 0 }}>
              {RSS_CATEGORIES.find((c) => c.key === selectedCategory)?.label}
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchNews(selectedCategory)}
              loading={loading}
            >
              Làm mới
            </Button>
          </div>

          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: "#f0f2f5",
              borderRadius: 8,
            }}
          >
            {error && (
              <Alert
                message="Lỗi"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 20 }}
              />
            )}

            {loading ? (
              <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" tip="Đang tải tin tức..." />
              </div>
            ) : (
              <Row gutter={[24, 24]}>
                {news.map((item, index) => {
                  const date = dayjs(item.pubDate).format("DD/MM/YYYY HH:mm");

                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={index}>
                      <Card
                        hoverable
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        cover={
                          <div style={{ height: 180, overflow: "hidden" }}>
                            <img
                              alt={item.title}
                              src={item.thumbnail}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transition: "transform 0.3s",
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://placehold.co/600x400?text=VnExpress";
                              }}
                            />
                          </div>
                        }
                        actions={[
                          <Button
                            type="link"
                            href={item.link}
                            target="_blank"
                            icon={<LinkOutlined />}
                          >
                            Đọc chi tiết
                          </Button>,
                        ]}
                        bodyStyle={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          padding: "12px",
                        }}
                      >
                        <Meta
                          title={
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#333",
                                fontSize: "16px",
                                lineHeight: "1.4",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {item.title}
                            </a>
                          }
                          description={
                            <div style={{ marginTop: 10 }}>
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "12px",
                                  display: "block",
                                  marginBottom: 5,
                                }}
                              >
                                {date}
                              </Text>
                              <Paragraph
                                ellipsis={{ rows: 3 }}
                                style={{ fontSize: "14px", color: "#666" }}
                              >
                                {item.description}
                              </Paragraph>
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Content>
          <Footer style={{ textAlign: "center" }}>
            VnExpress RSS Reader ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;

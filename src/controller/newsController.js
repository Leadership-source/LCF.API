import { prisma } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "../service/notificationService.js";

const uploadNewsImage = async (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "leadership/news",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(buffer);
  });
};

//all news
export const getNewsArticles = async (req, res) => {
  try {
    const articles = await prisma.newsArticle.findMany({
      orderBy: {
        date: "desc",
      },
    });

    res.status(200).json(articles);
  } catch (error) {
    console.error("Get news error:", error);

    res.status(500).json({
      message: "Failed to fetch news articles",
    });
  }
};

//all public news
export const getPublicNewsArticles = async (req, res) => {
  try {
    const articles = await prisma.newsArticle.findMany({
      where: {
        isPublished: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    res.status(200).json(articles);
  } catch (error) {
    console.error("Get public news error:", error);

    res.status(500).json({
      message: "Failed to fetch public news articles",
    });
  }
};

/**
 * =========================
 * GET SINGLE NEWS ARTICLE
 * =========================
 *
 * Used by the news details page.
 */
export const getNewsArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const articleId = Number(id);

    if (Number.isNaN(articleId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid news article ID.",
      });
    }

    const article = await prisma.newsArticle.findUnique({
      where: {
        id: articleId,
      },
    });

    if (!article) {
      return res.status(404).json({
        status: "error",
        message: "News article not found.",
      });
    }

    return res.status(200).json({
      status: "success",
      data: article,
    });
  } catch (error) {
    console.error("GET NEWS ARTICLE ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to fetch news article.",
    });
  }
};

//create news
export const createNewsArticle = async (req, res) => {
  try {
    const { title, category, date, readTime, excerpt, content } = req.body;

    if (!title || !category || !date || !excerpt || !content) {
      return res.status(400).json({
        status: "error",
        message: "Title, category, date, excerpt and content are required.",
      });
    }

    /**
     * Validate image
     */
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "News article image is required.",
      });
    }

    const articleDate = new Date(date);

    if (Number.isNaN(articleDate.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "Invalid news article date.",
      });
    }

    const result = await uploadNewsImage(req.file.buffer);

    const article = await prisma.newsArticle.create({
      data: {
        title,
        category,
        date: articleDate,
        readTime: readTime || null,
        image: result.secure_url,
        excerpt,
        content,

        isPublished: false,
      },
    });

    if (req.user?.id) {
      await createNotification({
        userId: req.user.id,
        message: `News article "${article.title}" has been created.`,
        type: "NEWS_CREATED",
      });
    }

    return res.status(201).json({
      status: "success",
      message: "News article created successfully.",
      data: article,
    });
  } catch (error) {
    console.error("CREATE NEWS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to create news article.",
    });
  }
};

export const updateNewsArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const articleId = Number(id);

    if (Number.isNaN(articleId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid news article ID.",
      });
    }

    /**
     * Find existing article
     */
    const existingArticle = await prisma.newsArticle.findUnique({
      where: {
        id: articleId,
      },
    });

    if (!existingArticle) {
      return res.status(404).json({
        status: "error",
        message: "News article not found.",
      });
    }

    const { title, category, date, readTime, excerpt, content } = req.body;

    let imageUrl = existingArticle.image;

    if (req.file) {
      const result = await uploadNewsImage(req.file.buffer);

      imageUrl = result.secure_url;
    }

    let articleDate = existingArticle.date;

    if (date !== undefined && date !== "") {
      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid news article date.",
        });
      }

      articleDate = parsedDate;
    }

    const updatedArticle = await prisma.newsArticle.update({
      where: {
        id: articleId,
      },
      data: {
        title: title ?? existingArticle.title,
        category: category ?? existingArticle.category,
        date: articleDate,
        readTime:
          readTime !== undefined ? readTime || null : existingArticle.readTime,
        image: imageUrl,
        excerpt: excerpt ?? existingArticle.excerpt,
        content: content ?? existingArticle.content,
      },
    });

    if (req.user?.id) {
      await createNotification({
        userId: req.user.id,
        message: `News article "${updatedArticle.title}" has been updated.`,
        type: "NEWS_UPDATED",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "News article updated successfully.",
      data: updatedArticle,
    });
  } catch (error) {
    console.error("UPDATE NEWS ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to update news article.",
    });
  }
};

export const updateNewsStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid news article ID",
      });
    }

    const { isPublished } = req.body;

    if (typeof isPublished !== "boolean") {
      return res.status(400).json({
        message: "isPublished must be a boolean",
      });
    }

    const article = await prisma.newsArticle.update({
      where: { id },
      data: { isPublished },
    });

    res.status(200).json({
      message: `News article ${
        isPublished ? "published" : "unpublished"
      } successfully`,
      article,
    });
  } catch (error) {
    console.error("Update news status error:", error);

    res.status(500).json({
      message: "Failed to update news status",
    });
  }
};

export const deleteNewsArticle = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid news article ID",
      });
    }

    const existingArticle = await prisma.newsArticle.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return res.status(404).json({
        message: "News article not found",
      });
    }

    await prisma.newsArticle.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "News article deleted successfully",
    });
  } catch (error) {
    console.error("Delete news error:", error);

    return res.status(500).json({
      message: "Failed to delete news article",
    });
  }
};

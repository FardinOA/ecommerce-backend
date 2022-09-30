class ApiFreatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    search() {
        const keyword = this.queryStr.keyword
            ? {
                  name: {
                      $regex: this.queryStr.keyword,
                      $options: "i",
                  },
              }
            : {};

        this.query = this.query.find({ ...keyword });

        return this;
    }

    filter() {
        const queryCopy = { ...this.queryStr };

        // removing some field for category
        const removeField = ["keyword", "page", "limit"];
        removeField.forEach((keyword) => delete queryCopy[keyword]);

        let queryStr = JSON.stringify(queryCopy);
        //adding mongodb '$' operator to query string
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    pagination(pageLimit) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = pageLimit * (currentPage - 1);
        this.query = this.query.limit(pageLimit).skip(skip);
        return this;
    }
}

module.exports = ApiFreatures;

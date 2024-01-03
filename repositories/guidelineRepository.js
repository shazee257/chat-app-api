"use strict";

const { createGuideline, findGuideline, findAllGuideline, deleteGuideline } = require("../models/guidelineModel");
const { parseBody } = require("../utils");
const { addGuidelineValidation } = require("../validation/guidelineValidation");
const { STATUS_CODES, GUIDELINE } = require("../utils/constants");
class GuidelineRepository {
  // add terms and policy
  addTermsAndPolicy = async (data) => {
    const body = parseBody(data);

    // Joi validation

    const { error } = addGuidelineValidation.validate(body);
    if (error)
      return {
        statusCode: STATUS_CODES.UNPROCESSABLE_ENTITY,
        message: error.details[0].message,
      };

    try {
      const termsAndPolicy = await createGuideline(body);
      if (!termsAndPolicy)
        return {
          statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
          message: `${data.type} creation failed`,
        };

      return {
        termsAndPolicy,
        message: `${data.type} created`,
        statusCode: STATUS_CODES.SUCCESS,
      };
    } catch (error) {
      return error;
    }
  };

  // get policy
  getPolicy = async (data) => {
    try {
      const policy = await findGuideline({ type: GUIDELINE.PRIVACY_POLICY });
      if (!policy)
        return {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: "Policy not found",
        };

      return {
        policy,
        message: "Policy found",
        statusCode: STATUS_CODES.SUCCESS,
      };
    } catch (error) {
      return error;
    }
  };

  // get terms
  getTerms = async (data) => {
    try {
      const terms = await findGuideline({
        type: GUIDELINE.TERMS_AND_CONDITIONS,
      });
      if (!terms)
        return {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: "Terms not found",
        };

      return {
        terms,
        message: "Terms found",
        statusCode: STATUS_CODES.SUCCESS,
      };
    } catch (error) {
      return error;
    }
  };

  // get faqs
  getFaqs = async (data) => {
    try {
      const faqs = await findAllGuideline({ type: GUIDELINE.FAQS });
      if (faqs.length==0)
        return {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: "FAQs not found",
        };

      return { faqs, message: "FAQs found", statusCode: STATUS_CODES.SUCCESS };
    } catch (error) {
      return error;
    }
  };

  deleteFaq = async (data)=>{
    return await deleteGuideline({_id:data.faqId})
  }

  // get 'About'
  getAbout = async (data) => {
    try {
      const about = await findGuideline({ type: GUIDELINE.ABOUT });
      if (!about)
        return {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: "About Not found",
        };

      return {
        about,
        message: "About found",
        statusCode: STATUS_CODES.SUCCESS,
      };
    } catch (error) {
      return error;
    }
  };
}

module.exports = GuidelineRepository;

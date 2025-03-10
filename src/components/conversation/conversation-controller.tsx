import React from "react";
import { Send } from "lucide-react";

// Import components
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

// Import objects
import { ConversationAPI } from "src/objects/conversation/api";
import { ConversationUtils } from "src/objects/conversation/utils";
import { ConversationConstants } from "src/objects/conversation/constant";

// Import state
import { useConversationState } from "src/states/conversation";

// Import utils
import { ConversationUIUtils } from "./utils";

// Import types
import type { DialogType } from "src/objects/conversation/types";
const inputPlaceHolder = "Start conversation with Fly Explorer...";

/**
 * Use to render a conversation controller with suggest feature in user input.
 * @returns
 */
export default function ConversationController() {
  const {
    conversation,
    addDialogs,
    removeLastDialog,
    setConversationResponseStatus,
  } = useConversationState();

  const inputRef = React.useRef<HTMLDivElement | null>(null);

  // Event handlers
  const {
    handleKeyDownEvent,
    handleInputEvent,
    handleSubmit,
    handleBlurEvent,
    handleFocusEvent,
  } = React.useMemo(() => {
    const _updateAIResponse = function (dialogs: DialogType[]) {
      setConversationResponseStatus("WAITING");
      removeLastDialog();
      // Update dialog
      addDialogs(dialogs);
    };

    /**
     * Use to emphasize a keyword by creating 3 elements:
     * - `Keyword element`: to let user knows this is a keyword
     * - `Node Text element`: to separate new input with keyword element
     * - `Suggestion element`: to let user knows what thing that this
     * keyword can do
     *
     * Both of them contain some custom data attributes to let
     * other handlers know:
     * - How to process them?
     * - What do they want to tell?
     *
     * For example: use enters the last character of `balance`,
     * regexp of this keyword is found. Other handlers can know
     * this `balance` keyword is by attributes set in its element.
     *
     * The process can described in these steps:
     *
     * 1. Get match value from Regexp.
     * 2. Get keyword metadata from Regexp.
     * 3. Create and set attributes for `Keyword element` from keyword metadata.
     * 4. Create and set attributes for `Node Text element`.
     * 5. Create and set attributes for `Suggestion element` from keyword metadata.
     * 6. Add all of them to Target element (user input element).
     * 7. Move cusor to Node text element to allow user continously inputs.
     *
     * @param target
     * @returns
     */
    const _emphasizeKeyword = function (target: HTMLDivElement) {
      const text = target.textContent;

      // If input doesn't have any content, skip this function.
      if (!text) return;

      const regex = ConversationUIUtils.getKeywordRegex(text);

      if (regex) {
        // Remove text
        const keywordMatch = text.match(regex);

        if (!keywordMatch) return;

        const userInputKeyword = keywordMatch[0];

        target.textContent = text.replace(regex, "");

        const highlightKeywordElement =
          ConversationUIUtils.createHighlightKeywordElement(userInputKeyword);
        const spaceElement = document.createTextNode("\u00A0");

        const keywordMetadata = ConversationUIUtils.getKeywordMetadata(regex)!;
        let suggestionContent = keywordMetadata.suggestion;

        // Replace something
        if (suggestionContent.includes("{{WALLET ADDRESS}}")) {
          suggestionContent = suggestionContent.replace(
            "{{WALLET ADDRESS}}",
            // account address
          );
        }

        const suggestionElement =
          ConversationUIUtils.createInputPlaceHolderElement(suggestionContent);

        // Set data attribute
        suggestionElement.setAttribute(
          ConversationUIUtils.SuggestionCustomAttributeKeys.Type,
          "suggestion"
        );
        suggestionElement.setAttribute(
          ConversationUIUtils.SuggestionCustomAttributeKeys.Value,
          keywordMetadata.value
        );

        // Append chill to element
        target.appendChild(highlightKeywordElement);
        target.appendChild(spaceElement);
        target.appendChild(suggestionElement);

        // Move cursor to end
        ConversationUIUtils.setCusorToContenteditable(spaceElement);
      }
    };

    const _clearAll = function (target: HTMLDivElement) {
      while (target.firstChild) {
        if (target.lastChild) target.removeChild(target.lastChild);
      }
    };

    const _clear = function (target: HTMLDivElement) {
      if (target.childNodes.length > 1) return;

      const childNode = target.childNodes[0];

      if (childNode === target.querySelector("br")) {
        target.removeChild(childNode);
      }

      if (childNode === target.querySelector("span")) {
        target.removeChild(childNode);
      }
    };

    const _placeHolderElement = function (target: HTMLDivElement) {
      if (target.childNodes.length === 0) {
        target.appendChild(
          ConversationUIUtils.createInputPlaceHolderElement(inputPlaceHolder)
        );
      }
    };

    const _removePlaceHolderElement = function (target: HTMLDivElement) {
      if (
        target.childNodes.length === 1 &&
        target.childNodes[0].textContent === inputPlaceHolder
      ) {
        target.removeChild(target.childNodes[0]);
      }
    };

    const _getContentMetadata = function (target: HTMLDivElement) {
      const childNodes = target.childNodes;
      let content = "";
      let action = "";

      for (const childNode of childNodes) {
        if (typeof childNode === "object") {
          // Check if there is any request action from keyword
          if (
            (childNode as HTMLElement).getAttribute &&
            ConversationUIUtils.hasKeywordValue(
              (childNode as HTMLElement).getAttribute(
                ConversationUIUtils.KeywordAttributeKeys.RequestAction
              )
            )
          ) {
            action = (childNode as HTMLElement).getAttribute(
              ConversationUIUtils.KeywordAttributeKeys.RequestAction
            )!;
          }

          // Append content
          content += childNode.textContent;
          // Just append content
        } else content += childNode;
      }

      return { content, action };
    };

    // Handle submit
    const handleSubmit = function (target: HTMLDivElement) {
       const contentMetadata = _getContentMetadata(target);
      console.log("Content:", contentMetadata);
      const userDialog = ConversationUtils.createDialog(
        contentMetadata.content
      );
      
      // Find content: "insight || give me " -> add action: DATA_INSIGHT
      const findContent: string = contentMetadata.content.toLowerCase();
      // codition: "insight data", "what is the data", "show me the data purpose",
      // "give me insights", "data insight", "what is author post", "give me author post", "what post about", "what post about author"
      if (findContent.includes("insight") || findContent.includes("what post about") || findContent.includes("give me") || findContent.includes("data") || findContent.includes("purpose") || findContent.includes("author post") || findContent.includes("post about") || findContent.includes("post about author")) {
        contentMetadata.action = "DATA_INSIGHT";
        contentMetadata.content = contentMetadata.content + " this is action DATA_INSIGHT";
      }
      console.log("User Dialog:", userDialog);

      // Add placeholder for AI's Response
      const aiPlaceHolderDialog = ConversationUtils.createDialog(
        ConversationConstants.RespondingMessage,
        ConversationConstants.Senders.AI
      );
      aiPlaceHolderDialog.isBeingGenerated = true;
      aiPlaceHolderDialog.action = contentMetadata.action;

      // Update dialog
      addDialogs([userDialog, aiPlaceHolderDialog]);
      // Update response status
      setConversationResponseStatus("RESPONDING");

      // Clear data
      if (inputRef.current) {
        _clearAll(inputRef.current);
        inputRef.current.blur();
      }

      // Send request
      ConversationAPI.askBot(userDialog.text, conversation.agentId).then(
        (data) => {
          if (!data) {
            const aiDialog = ConversationUtils.createDialog(
              "I'm sorry, I'm not able to process your request. Please try again.",
              ConversationConstants.Senders.AI
            );

            _updateAIResponse([aiDialog]);
            setConversationResponseStatus("WAITING");
            return;
          }

          if (data.length > 1) {
            if (data[1].params) {
              console.log("Param:", data[1].params?.relevantPosts);
            }
          }

          // Frontend gets response from AI, there are many steps to do:
          // 1. Create dialog for AI (shouldn't replace).
          // 2. Process Reasoning by add it to dialog (I can replace this step).
          // 3. Update response status to DONE (shouldn't replace).
          // 4. Create a new timeout for final change (shouldn't replace).

          // To do: create dialog for AI
          // const aiDialog = ConversationUtils.createDialogFromResponse();

          const aiDiaLogs: any[] = [];
          for (const response of data) {
            aiDiaLogs.push(
              ConversationUtils.createDialogFromResponse(response)
            );
          }
          // Update response status
          setConversationResponseStatus("DONE");

          // To do: after 50ms, update conversation response status
          // This timeout will allow program do anything else, other jobs.
          const timeout = setTimeout(() => {
            _updateAIResponse(aiDiaLogs);
          }, 50);
        }
      );
    };
    // Handle keydown event
    const handleKeyDownEvent = function (
      e: React.KeyboardEvent<HTMLDivElement>
    ) {
      const target = e.currentTarget as HTMLDivElement;

      // User presses Enter
      // Prevent add more lines on Enter key press
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();

        // Submit
        handleSubmit(target);
      }

      // User presses Enter + Shift
      if (e.key === "Enter" && e.shiftKey) {
        target.textContent += "";
      }

      // User presses tab
      if (e.key === "Tab") {
        e.preventDefault();
        // Append last span's content to element
        const lastChildSpan = target.childNodes[target.childNodes.length - 1];

        if (!lastChildSpan) return;

        if (
          typeof lastChildSpan === "object" &&
          (lastChildSpan as HTMLSpanElement).getAttribute &&
          (lastChildSpan as HTMLSpanElement).getAttribute(
            ConversationUIUtils.SuggestionCustomAttributeKeys.Type
          ) === "suggestion"
        ) {
          const lastChildSpanContentElement = document.createTextNode(
            lastChildSpan.textContent!
          );
          target.removeChild(lastChildSpan);
          target.appendChild(lastChildSpanContentElement);

          // Move cusor to last
          ConversationUIUtils.setCusorToContenteditable(
            lastChildSpanContentElement
          );
        }
      }

      // Allow paste
      if (e.ctrlKey && e.key === "v") {
        navigator.clipboard.readText().then((data) => {
          if (inputRef.current) {
            const textNode = document.createTextNode(data);
            inputRef.current.appendChild(textNode);
            ConversationUIUtils.setCusorToContenteditable(textNode);
          }
        });
        return;
      }

      // User presses normal key
      // If input has suggestion element
      const lastChildSpan = target.childNodes[target.childNodes.length - 1];

      if (!lastChildSpan) return;

      if (
        typeof lastChildSpan === "object" &&
        (lastChildSpan as HTMLSpanElement).getAttribute &&
        (lastChildSpan as HTMLSpanElement).getAttribute(
          ConversationUIUtils.SuggestionCustomAttributeKeys.Type
        ) === "suggestion"
      ) {
        target.removeChild(lastChildSpan);
      }
    };
    // Handle input event
    const handleInputEvent = function (e: React.FormEvent<HTMLDivElement>) {
      const target = e.currentTarget as HTMLDivElement;
      target.style.height = "60px";
      target.style.height = target.scrollHeight + "px";

      _placeHolderElement(target);
      _emphasizeKeyword(target);
      _clear(target);
    };
    // Handle focus event
    const handleFocusEvent = function (
      e: React.FocusEvent<HTMLDivElement, Element>
    ) {
      const target = e.currentTarget as HTMLDivElement;
      const parentElement = target.parentElement as HTMLDivElement;

      // Add focus ring when textarea is focused
      parentElement.classList.add("ring-2");

      // Remove input placeholder
      _removePlaceHolderElement(target);
    };
    // Handle blur event
    const handleBlurEvent = function (
      e: React.FocusEvent<HTMLDivElement, Element>
    ) {
      const target = e.currentTarget as HTMLDivElement;
      const parentElement = target.parentElement as HTMLDivElement;

      // Remove focus ring when textarea is blurred
      parentElement.classList.remove("ring-2");
      _placeHolderElement(target);
    };

    return {
      handleKeyDownEvent,
      handleInputEvent,
      handleSubmit,
      handleBlurEvent,
      handleFocusEvent,
    };
  }, [inputRef.current, conversation.agentId]);

  React.useEffect(() => {
    if (inputRef.current && inputRef.current.childNodes.length === 0) {
      inputRef.current.appendChild(
        ConversationUIUtils.createInputPlaceHolderElement(inputPlaceHolder)
      );
    }
  }, [inputRef.current]);

  return (
    <div className="relative w-full max-w-[840px] mx-auto border rounded-lg flex items-end px-3 py-2 bg-gray-100 hover:ring-2">
      <div
        id="user-input"
        contentEditable={conversation.responseStatus === "WAITING"}
        ref={inputRef}
        className="w-full min-h-[60px] bg-transparent max-h-[156px] focus:outline-0"
        onKeyDown={handleKeyDownEvent}
        onInput={handleInputEvent}
        onFocus={handleFocusEvent}
        onBlur={handleBlurEvent}
      />
      <Button
        disabled={conversation.responseStatus !== "WAITING"}
        onClick={() => {
          if (inputRef.current) handleSubmit(inputRef.current);
        }}
        variant="outline"
        className="ms-2"
        size="icon"
      >
        <Send />
      </Button>
    </div>
  );
}
